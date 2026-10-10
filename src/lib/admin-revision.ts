import { unstable_cache, revalidateTag } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

// Shared cache tag for the admin "revision" fingerprint. Any admin-visible
// write calls `revalidateAdmin()` to invalidate it, so the next poll notices a
// change and refreshes the page. The getter itself is cached in Next's Data
// Cache, so idle polling opens no MySQL connection.
export const ADMIN_REVISION_TAG = "admin-rev";

export interface AdminRevision {
  revision: string;
  orders: number;
  products: number;
  customers: number;
  returns: number;
  lowStock: number;
  updatedAt: string;
}

function latest(dates: Array<Date | null | undefined>): Date | null {
  return dates.reduce<Date | null>(
    (acc, d) => (d instanceof Date && (!acc || d > acc) ? d : acc),
    null,
  );
}

// The homepage layout config is a JSON file, not a DB row, so track its
// modification time as a best-effort change signal. If the file is unreadable
// (e.g. a read-only serverless filesystem) this harmlessly returns "0".
async function homepageConfigSignal(): Promise<string> {
  try {
    const file = path.join(process.cwd(), "src", "config", "homepage-sections.json");
    const stat = await fs.stat(file);
    return String(stat.mtimeMs);
  } catch {
    return "0";
  }
}

async function computeAdminRevision(): Promise<AdminRevision> {
  const [order, product, customer, returnReq, lowStock, inventory, category, subcategory, collection, homepageSignal] =
    await Promise.all([
      prisma.order.aggregate({ _count: true, _max: { updatedAt: true } }),
      prisma.product.aggregate({ _count: true, _max: { updatedAt: true } }),
      prisma.user.aggregate({ _count: true, _max: { updatedAt: true } }),
      prisma.returnRequest.aggregate({ _count: true, _max: { updatedAt: true } }),
      prisma.inventory.count({ where: { stockQuantity: { lte: 0 } } }),
      prisma.inventory.aggregate({ _max: { updatedAt: true } }),
      prisma.category.aggregate({ _max: { updatedAt: true } }),
      prisma.subcategory.aggregate({ _max: { updatedAt: true } }),
      prisma.collection.aggregate({ _max: { updatedAt: true } }),
      homepageConfigSignal(),
    ]);

  const maxDate = latest([
    order._max.updatedAt,
    product._max.updatedAt,
    customer._max.updatedAt,
    returnReq._max.updatedAt,
    inventory._max.updatedAt,
    category._max.updatedAt,
    subcategory._max.updatedAt,
    collection._max.updatedAt,
  ]);

  const updatedAt = (maxDate ?? new Date(0)).toISOString();
  const revision = [
    order._count,
    product._count,
    customer._count,
    returnReq._count,
    lowStock,
    updatedAt,
    homepageSignal,
  ].join(":");

  return {
    revision,
    orders: order._count,
    products: product._count,
    customers: customer._count,
    returns: returnReq._count,
    lowStock,
    updatedAt,
  };
}

// Cached so polling stays cheap: a cache hit performs no MySQL query. Writes
// call revalidateTag(ADMIN_REVISION_TAG) for near-instant invalidation; the 30s
// revalidate is only a safety net for any write path that forgets to.
export const getAdminRevision = unstable_cache(computeAdminRevision, ["admin-revision"], {
  tags: [ADMIN_REVISION_TAG],
  revalidate: 30,
});

export function revalidateAdmin(): void {
  revalidateTag(ADMIN_REVISION_TAG, "max");
}
