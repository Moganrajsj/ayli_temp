"use server";

import type { ReturnStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVerifiedAdmin } from "@/lib/admin";
import { revalidateAdmin } from "@/lib/admin-revision";
import type { AdminActionResult } from "@/lib/validation";

async function requireAdmin(): Promise<{ id: string } | null> {
  return getVerifiedAdmin();
}

function notAuthorized(): AdminActionResult {
  return { ok: false, message: "You are not authorized to perform this action." };
}

const RETURN_STATUS_FILTERS = new Set<ReturnStatus>([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RECEIVED",
  "REFUNDED",
]);

export async function getAdminReturnRequests(statusFilter?: string) {
  const admin = await requireAdmin();
  if (!admin) return [];

  const status =
    statusFilter && RETURN_STATUS_FILTERS.has(statusFilter as ReturnStatus)
      ? (statusFilter as ReturnStatus)
      : undefined;

  try {
    return await prisma.returnRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: { select: { id: true, orderNumber: true, total: true, paymentStatus: true, paymentId: true } },
        items: { include: { orderItem: true } },
        refunds: true,
      },
    });
  } catch (error) {
    console.error("getAdminReturnRequests error:", error);
    return [];
  }
}

export async function updateReturnStatusAction(
  returnRequestId: string,
  status: "APPROVED" | "REJECTED" | "RECEIVED",
  adminNotes?: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const req = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
    select: { id: true },
  });

  if (!req) return { ok: false, message: "Return request not found." };

  await prisma.returnRequest.update({
    where: { id: returnRequestId },
    data: {
      status,
      adminNotes: adminNotes?.trim() || null,
    },
  });

  revalidateAdmin();
  return { ok: true, message: `Return request marked as ${status}.` };
}

export async function processReturnRefundAction(
  returnRequestId: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
    include: {
      order: { select: { id: true, orderNumber: true, paymentId: true, paymentStatus: true, total: true } },
      items: { include: { orderItem: true } },
    },
  });

  if (!returnReq) return { ok: false, message: "Return request not found." };

  if (returnReq.status === "REFUNDED") {
    return { ok: true, message: "This return has already been refunded." };
  }

  // Calculate refund amount based on returned items
  const refundAmount = returnReq.items.reduce(
    (sum, item) => sum + Number(item.orderItem.price) * item.quantity,
    0
  );

  let razorpayRefundId: string | null = null;
  let refundStatus = "PROCESSED";

  // Trigger automated PhonePe refund if payment was captured.
  // order.orderNumber = merchantTransactionId used at payment time.
  if (returnReq.order.paymentId && returnReq.order.paymentStatus === "PAID") {
    try {
      const { PhonePeProvider } = await import("@/lib/phonepe");
      const phonePeProvider = new PhonePeProvider();
      const result = await phonePeProvider.refundPayment(
        returnReq.order.orderNumber,  // merchantTransactionId
        returnReq.order.paymentId!,   // originalTransactionId (PhonePe's txn ID)
        refundAmount
      );
      razorpayRefundId = result.id;
      refundStatus = result.status;
    } catch (err) {
      console.error("PhonePe refund error:", err);
      return {
        ok: false,
        message: err instanceof Error ? err.message : "PhonePe refund processing failed.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    // 1. Restore stock for returned items
    for (const item of returnReq.items) {
      await tx.inventory.update({
        where: { variantId: item.orderItem.variantId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }

    // 2. Create Refund record
    await tx.refund.create({
      data: {
        orderId: returnReq.orderId,
        returnRequestId: returnReq.id,
        razorpayRefundId,
        amount: refundAmount,
        status: refundStatus,
        reason: returnReq.reason,
      },
    });

    // 3. Mark ReturnRequest & Order as REFUNDED / RETURNED
    await tx.returnRequest.update({
      where: { id: returnReq.id },
      data: { status: "REFUNDED" },
    });

    await tx.order.update({
      where: { id: returnReq.orderId },
      data: { status: "RETURNED", paymentStatus: "REFUNDED" },
    });
  });

  revalidateAdmin();
  return { ok: true, message: "Return processed, stock restored, and refund executed." };
}
