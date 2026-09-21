import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InventoryTable, type InventoryRow } from "@/components/admin/inventory-table";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Per-variant stock levels and adjustments.",
};

export default async function AdminInventoryPage() {
  const inventory = await prisma.inventory.findMany({
    orderBy: { stockQuantity: "asc" },
    include: {
      variant: {
        include: {
          product: { select: { name: true, slug: true } },
        },
      },
    },
  });

  const rows: InventoryRow[] = inventory.map((inv) => ({
    variantId: inv.variantId,
    productName: inv.variant.product.name,
    slug: inv.variant.product.slug,
    colour: inv.variant.colour,
    size: inv.variant.size,
    sku: inv.variant.sku,
    stock: inv.stockQuantity,
    threshold: inv.lowStockThreshold,
  }));

  const lowStockCount = rows.filter((r) => r.stock <= r.threshold).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Inventory</h1>
      <p className="mt-1 text-sm text-muted">
        {rows.length} variants · {lowStockCount} at or below low-stock threshold.
      </p>
      <div className="mt-6">
        <InventoryTable rows={rows} />
      </div>
    </div>
  );
}