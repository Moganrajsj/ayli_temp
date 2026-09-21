import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Icon } from "@/components/ui/icons";
import type { OrderStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Orders",
  description: "View and manage customer orders.",
};

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = (params.status ?? "").toUpperCase().trim();
  const q = (params.q ?? "").trim();

  const statuses = ["", "PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

  const where: Record<string, unknown>[] = [];
  if (status && status !== "ALL") where.push({ status: status as OrderStatus });
  if (q) {
    where.push({
      OR: [
        { orderNumber: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ],
    });
  }

  const orders = await prisma.order.findMany({
    where: where.length > 0 ? { AND: where } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { id: true, quantity: true } },
    },
  });

  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });

  const countsMap = new Map(statusCounts.map((s) => [s.status, s._count]));
  const totalAll = statusCounts.reduce((sum, s) => sum + s._count, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Orders</h1>
      <p className="mt-1 text-sm text-muted">{totalAll} orders total</p>

      {/* Status tabs */}
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Filter by status">
        {statuses.map((s) => {
          const label = s ? s.charAt(0) + s.slice(1).toLowerCase() : "All";
          const href = s ? `/admin/orders?status=${s}` : "/admin/orders";
          const count = s ? (countsMap.get(s as OrderStatus) ?? 0) : totalAll;
          const active = (status || "ALL") === (s || "ALL");
          return (
            <Link
              key={s}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-ayli-blue text-white shadow-soft"
                  : "border border-hairline bg-warm-white text-ink hover:bg-soft-beige"
              }`}
            >
              {label}
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
                  active ? "bg-white/20" : "bg-soft-beige text-muted"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Search */}
      <form method="get" className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Order number, name or email…"
            className="h-11 w-72 max-w-full rounded-card border border-hairline bg-warm-white px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-ayli-blue focus:outline-none"
          />
        </label>
        {status ? (
          <input type="hidden" name="status" value={status} />
        ) : null}
        <button
          type="submit"
          className="flex h-11 items-center gap-2 rounded-pill bg-ink px-5 text-sm font-medium text-warm-white transition-colors hover:bg-black"
        >
          <Icon name="search" className="h-4 w-4" />
          Search
        </button>
      </form>

      {/* Table */}
      <div className="mt-5 overflow-x-auto rounded-card border border-hairline bg-warm-white shadow-soft">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs uppercase tracking-widest text-muted">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/70">
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-soft-beige/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">#{order.orderNumber}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="truncate text-ink">{order.user.name ?? "—"}</p>
                  <p className="truncate text-xs text-muted">{order.user.email}</p>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-muted">
                  {order.items.reduce((s, i) => s + i.quantity, 0)}
                </td>
                <td className="px-4 py-3 font-medium text-ink">{formatINR(Number(order.total))}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-sm font-medium text-ayli-blue hover:bg-ayli-blue/10"
                  >
                    <Icon name="chevron-right" className="h-4 w-4" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">No orders match your filters.</p>
        ) : null}
      </div>
    </div>
  );
}