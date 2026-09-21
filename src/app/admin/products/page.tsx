import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Products",
  description: "Manage the AYLI catalogue.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; active?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  const active = params.active;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q } },
              { sku: { contains: q } },
              { slug: { contains: q } },
            ],
          }
        : {},
      category ? { categoryId: category } : {},
      active === "inactive" ? { isActive: false } : active === "all" ? {} : active === "active" ? { isActive: true } : {},
    ],
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        mrp: true,
        sellingPrice: true,
        isActive: true,
        isFeatured: true,
        category: { select: { name: true } },
        variants: {
          where: { isActive: true },
          select: { inventory: { select: { stockQuantity: true } } },
        },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Products</h1>
          <p className="mt-1 text-sm text-muted">{total} products</p>
        </div>
        <Link href="/admin/products/new" className={buttonClasses({ size: "md" })}>
          <Icon name="plus" className="h-4 w-4" />
          New product
        </Link>
      </div>

      {/* Filters */}
      <form method="get" className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, SKU or slug…"
            className="h-11 w-64 max-w-full rounded-card border border-hairline bg-warm-white px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-ayli-blue focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Category</span>
          <select
            name="category"
            defaultValue={category}
            className="h-11 rounded-card border border-hairline bg-warm-white px-4 text-[15px] text-ink focus:border-ayli-blue focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Status</span>
          <select
            name="active"
            defaultValue={active ?? "all"}
            className="h-11 rounded-card border border-hairline bg-warm-white px-4 text-[15px] text-ink focus:border-ayli-blue focus:outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
        </label>
        <button
          type="submit"
          className="flex h-11 items-center gap-2 rounded-pill bg-ink px-5 text-sm font-medium text-warm-white transition-colors hover:bg-black"
        >
          <Icon name="search" className="h-4 w-4" />
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="mt-5 overflow-x-auto rounded-card border border-hairline bg-warm-white shadow-soft">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs uppercase tracking-widest text-muted">
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/70">
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + (v.inventory?.stockQuantity ?? 0), 0);
              return (
                <tr key={p.id} className="transition-colors hover:bg-soft-beige/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-muted">
                      {p.sku} · /{p.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category.name}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{formatINR(Number(p.sellingPrice))}</p>
                    <p className="text-xs text-muted line-through">{formatINR(Number(p.mrp))}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.isActive
                          ? "rounded-pill bg-success/10 px-2.5 py-1 text-xs font-semibold text-success"
                          : "rounded-pill bg-soft-beige px-2.5 py-1 text-xs font-semibold text-muted"
                      }
                    >
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-sm font-medium text-ayli-blue hover:bg-ayli-blue/10"
                    >
                      <Icon name="edit" className="h-4 w-4" />
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No products match your filters.
          </p>
        ) : null}
      </div>

      {/* Pagination */}
      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="flex h-9 items-center rounded-pill border border-hairline bg-warm-white px-4 text-sm font-medium text-ink hover:bg-soft-beige"
              >
                Previous
              </a>
            ) : null}
            {page < pageCount ? (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="flex h-9 items-center rounded-pill border border-hairline bg-warm-white px-4 text-sm font-medium text-ink hover:bg-soft-beige"
              >
                Next
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}