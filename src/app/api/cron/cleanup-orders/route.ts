import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateAdmin } from "@/lib/admin-revision";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Verify secret authorization header for cron job if configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  // Find stale PENDING orders created > 30 minutes ago
  const staleOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: thirtyMinutesAgo },
    },
    include: { items: true },
  });

  let cleaned = 0;

  for (const order of staleOrders) {
    try {
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
          data: { status: "CANCELLED", paymentStatus: "FAILED" },
        });
      });
      cleaned += 1;
    } catch (err) {
      console.error(`Failed to cleanup stale order ${order.id}:`, err);
    }
  }

  if (cleaned > 0) revalidateAdmin();

  return NextResponse.json({ ok: true, cleanedTotal: cleaned });
}
