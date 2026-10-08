// PhonePe Server-to-Server (S2S) webhook handler.
// PhonePe POSTs a { response: "<base64>" } payload to this endpoint when a
// payment event occurs. The X-VERIFY header must be validated before processing.
//
// PhonePe retries the webhook up to 3 times if we don't respond 200.
//
// Event codes handled:
//   PAYMENT_SUCCESS  — Confirm order, deduct stock.
//   PAYMENT_ERROR    — Cancel order, release reserved stock.
//   PAYMENT_DECLINED — Same as PAYMENT_ERROR.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPhonePeWebhookSignature } from "@/lib/phonepe";

export const runtime = "nodejs";

interface PhonePeWebhookData {
  merchantId?: string;
  merchantTransactionId?: string;
  transactionId?: string;
  amount?: number;
  state?: string;
  responseCode?: string;
}

interface PhonePeWebhookEvent {
  code?: string;
  merchantId?: string;
  transactionId?: string;
  data?: PhonePeWebhookData;
}

export async function POST(request: NextRequest) {
  // 1. Read raw body — must happen before any other parsing.
  const rawBody = await request.text();

  // 2. Parse the outer envelope: { response: "<base64>" }
  let envelope: { response?: string };
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const base64Response = envelope.response;
  const xVerifyHeader = request.headers.get("x-verify");

  if (!base64Response || !xVerifyHeader) {
    return NextResponse.json(
      { ok: false, error: "Missing response payload or X-VERIFY header." },
      { status: 400 }
    );
  }

  // 3. Verify the X-VERIFY checksum using the PhonePe salt key.
  if (!verifyPhonePeWebhookSignature(base64Response, xVerifyHeader)) {
    return NextResponse.json(
      { ok: false, error: "Invalid X-VERIFY signature." },
      { status: 400 }
    );
  }

  // 4. Decode the inner event payload.
  let event: PhonePeWebhookEvent;
  try {
    event = JSON.parse(Buffer.from(base64Response, "base64").toString("utf-8"));
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not decode base64 event payload." },
      { status: 400 }
    );
  }

  const code = event?.code; // e.g. PAYMENT_SUCCESS, PAYMENT_ERROR, PAYMENT_DECLINED
  // merchantTransactionId is the orderNumber we used as paymentOrderId.
  const merchantTxnId = event?.data?.merchantTransactionId;
  // transactionId is PhonePe's own identifier — stored as paymentId.
  const phonePeTxnId = event?.data?.transactionId ?? event?.transactionId;

  // Nothing useful to process without a merchant transaction ID.
  if (!merchantTxnId) {
    return NextResponse.json({ ok: true, message: "No merchantTransactionId — skipped." });
  }

  // 5. Idempotency guard: skip already-processed events.
  const idempotencyKey = phonePeTxnId ?? merchantTxnId;
  const existingLog = await prisma.webhookLog.findUnique({
    where: { eventId: idempotencyKey },
    select: { id: true },
  });
  if (existingLog) {
    return NextResponse.json({ ok: true, message: "Event already processed." });
  }

  // 6. Handle the event.
  try {
    if (code === "PAYMENT_SUCCESS") {
      const order = await prisma.order.findFirst({
        where: { paymentOrderId: merchantTxnId },
        include: { items: true },
      });

      if (order && order.status === "PENDING") {
        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            const inv = await tx.inventory.findUnique({
              where: { variantId: item.variantId },
              select: { stockQuantity: true, reservedQuantity: true },
            });
            await tx.inventory.update({
              where: { variantId: item.variantId },
              data: {
                stockQuantity: Math.max(0, (inv?.stockQuantity ?? 0) - item.quantity),
                reservedQuantity: Math.max(0, (inv?.reservedQuantity ?? 0) - item.quantity),
              },
            });
          }

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              // Store PhonePe's transaction ID — may be null if not included in event.
              paymentId: phonePeTxnId ?? merchantTxnId,
            },
          });

          // Clear the user's cart.
          const cart = await tx.cart.findUnique({
            where: { userId: order.userId },
            select: { id: true },
          });
          if (cart) {
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          }
        });
      }
    } else if (code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED") {
      const order = await prisma.order.findFirst({
        where: { paymentOrderId: merchantTxnId },
        include: { items: true },
      });

      if (order && order.status === "PENDING") {
        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            const inv = await tx.inventory.findUnique({
              where: { variantId: item.variantId },
              select: { reservedQuantity: true },
            });
            await tx.inventory.update({
              where: { variantId: item.variantId },
              data: {
                reservedQuantity: Math.max(
                  0,
                  (inv?.reservedQuantity ?? 0) - item.quantity
                ),
              },
            });
          }

          await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED", paymentStatus: "FAILED" },
          });
        });
      }
    }
    // PAYMENT_PENDING — no action; wait for a terminal event.

    // 7. Log the event for idempotency and audit.
    await prisma.webhookLog.create({
      data: {
        eventId: idempotencyKey,
        eventType: code ?? "UNKNOWN",
        payload: rawBody.slice(0, 10_000),
        status: "PROCESSED",
      },
    });

    return NextResponse.json({ ok: true, message: "Webhook processed." });
  } catch (error) {
    console.error("PhonePe webhook processing error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook execution error.",
      },
      { status: 500 }
    );
  }
}
