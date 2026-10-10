import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateAdmin } from "@/lib/admin-revision";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook signature or secret missing." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    return NextResponse.json(
      { ok: false, error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  let eventPayload: {
    event?: string;
    event_id?: string;
    payload?: {
      payment?: {
        entity?: {
          id: string;
          order_id?: string;
          amount?: number;
          status?: string;
          notes?: Record<string, string>;
        };
      };
      order?: {
        entity?: {
          id: string;
          receipt?: string;
        };
      };
      refund?: {
        entity?: {
          id: string;
          payment_id?: string;
          amount?: number;
          status?: string;
        };
      };
    };
  };

  try {
    eventPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const eventId = eventPayload.event_id;
  const eventType = eventPayload.event;

  if (!eventId || !eventType) {
    return NextResponse.json(
      { ok: false, error: "Missing event_id or event type." },
      { status: 400 }
    );
  }

  // Idempotency check: Ignore duplicate webhooks
  const existingLog = await prisma.webhookLog.findUnique({
    where: { eventId },
    select: { id: true },
  });

  if (existingLog) {
    return NextResponse.json({ ok: true, message: "Event already processed." });
  }

  try {
    if (eventType === "order.paid" || eventType === "payment.captured") {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const paymentOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const orderIdFromNotes = paymentEntity?.notes?.orderId;

      if (paymentOrderId || orderIdFromNotes) {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              ...(paymentOrderId ? [{ paymentOrderId }] : []),
              ...(orderIdFromNotes ? [{ id: orderIdFromNotes }] : []),
            ],
          },
          include: { items: true },
        });

        if (order && order.status === "PENDING") {
          await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
              const inv = await tx.inventory.findUnique({
                where: { variantId: item.variantId },
                select: { stockQuantity: true, reservedQuantity: true },
              });
              const stock = inv?.stockQuantity ?? 0;
              const reserved = inv?.reservedQuantity ?? 0;
              await tx.inventory.update({
                where: { variantId: item.variantId },
                data: {
                  stockQuantity: Math.max(0, stock - item.quantity),
                  reservedQuantity: Math.max(0, reserved - item.quantity),
                },
              });
            }

            await tx.order.update({
              where: { id: order.id },
              data: {
                status: "CONFIRMED",
                paymentStatus: "PAID",
                paymentId: paymentId || order.paymentId,
              },
            });
          });
        }
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const paymentOrderId = paymentEntity?.order_id;
      const orderIdFromNotes = paymentEntity?.notes?.orderId;

      if (paymentOrderId || orderIdFromNotes) {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              ...(paymentOrderId ? [{ paymentOrderId }] : []),
              ...(orderIdFromNotes ? [{ id: orderIdFromNotes }] : []),
            ],
          },
          include: { items: true },
        });

        if (order && order.status === "PENDING") {
          await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
              const inv = await tx.inventory.findUnique({
                where: { variantId: item.variantId },
                select: { reservedQuantity: true },
              });
              const reserved = Math.max(0, (inv?.reservedQuantity ?? 0) - item.quantity);
              await tx.inventory.update({
                where: { variantId: item.variantId },
                data: { reservedQuantity: reserved },
              });
            }

            await tx.order.update({
              where: { id: order.id },
              data: {
                status: "CANCELLED",
                paymentStatus: "FAILED",
              },
            });
          });
        }
      }
    } else if (eventType === "refund.processed" || eventType === "refund.created") {
      const refundEntity = eventPayload.payload?.refund?.entity;
      if (refundEntity?.id && refundEntity?.payment_id) {
        const order = await prisma.order.findFirst({
          where: { paymentId: refundEntity.payment_id },
          select: { id: true },
        });

        if (order) {
          await prisma.refund.upsert({
            where: { razorpayRefundId: refundEntity.id },
            update: {
              status: refundEntity.status ?? "PROCESSED",
            },
            create: {
              orderId: order.id,
              razorpayRefundId: refundEntity.id,
              amount: (refundEntity.amount ?? 0) / 100,
              status: refundEntity.status ?? "PROCESSED",
            },
          });
        }
      }
    }

    // Refresh the admin panel's change fingerprint.
    revalidateAdmin();

    // Log event for idempotency
    await prisma.webhookLog.create({
      data: {
        eventId,
        eventType,
        payload: rawBody.slice(0, 10000),
        status: "PROCESSED",
      },
    });

    return NextResponse.json({ ok: true, message: "Webhook processed." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Webhook execution error" },
      { status: 500 }
    );
  }
}
