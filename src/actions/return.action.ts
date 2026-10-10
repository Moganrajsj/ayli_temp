"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidateAdmin } from "@/lib/admin-revision";

export interface ReturnActionResult {
  ok: boolean;
  message?: string;
  returnRequestId?: string;
}

async function requireUser(): Promise<{ id: string } | null> {
  const session = await auth();
  return session?.user?.id ? { id: session.user.id } : null;
}

export async function createReturnRequest(input: {
  orderId: string;
  itemIds: string[];
  reason: string;
  comments?: string;
  videoUrl?: string;
}): Promise<ReturnActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };

  if (!input.orderId || !input.reason.trim()) {
    return { ok: false, message: "Please select an order and provide a return reason." };
  }

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: user.id },
    include: { items: true },
  });

  if (!order) return { ok: false, message: "Order not found." };

  if (order.status !== "DELIVERED") {
    return { ok: false, message: "Only delivered orders are eligible for return requests." };
  }

  // Verify return window (15 days from delivery or creation)
  const deliveryDate = order.deliveredAt ?? order.updatedAt;
  const daysDiff = (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 15) {
    return { ok: false, message: "The 15-day return window for this order has expired." };
  }

  // Check if a return request already exists for this order
  const existingReturn = await prisma.returnRequest.findFirst({
    where: { orderId: order.id, userId: user.id },
  });
  if (existingReturn) {
    return { ok: false, message: "A return request has already been submitted for this order." };
  }

  const itemsToReturn = input.itemIds.length > 0
    ? order.items.filter((i) => input.itemIds.includes(i.id))
    : order.items;

  if (itemsToReturn.length === 0) {
    return { ok: false, message: "Please select at least one item to return." };
  }

  const returnReq = await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      userId: user.id,
      reason: input.reason.trim(),
      comments: input.comments?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
      status: "PENDING",
      items: {
        create: itemsToReturn.map((item) => ({
          orderItemId: item.id,
          quantity: item.quantity,
        })),
      },
    },
    select: { id: true },
  });

  revalidateAdmin();
  return { ok: true, returnRequestId: returnReq.id, message: "Return request submitted successfully." };
}

export async function getUserReturnRequests() {
  const user = await requireUser();
  if (!user) return [];

  return prisma.returnRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true, total: true } },
      items: { include: { orderItem: true } },
      refunds: true,
    },
  });
}
