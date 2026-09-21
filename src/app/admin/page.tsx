import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icons";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Store overview — revenue, orders, stock and customers.",
};

function StatCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  icon: IconName;
  tone?: "blue" | "peach" | "green" | "neutral";
}) {
  const tones: Record<string, string> = {
    blue: "bg-ayli-blue/10 text-ayli-blue",
    peach: "bg-ayli-peach/15 text-[#c96a45]",
    green: "bg-success/10 text-success",
    neutral: "bg-soft-beige text-muted",
  };
  return (
    <div className="flex items-center gap-4 rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tones[tone]}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted">{label}</p>
        <p className="truncate font-display text-2xl font-semibold tracking-tight text-ink">
          {value}
        </p>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [paidAggregate, orderCount, productCount, customerCount, lowStock, recentOrders] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.inventory.findMany({
        where: { stockQuantity: { lte: 0 } },
        include: { variant: { include: { product: { select: { name: true, slug: true } } } } },
        orderBy: { stockQuantity: "asc" },
        take: 8,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: { items: true, user: { select: { name: true, email: true } } },
        take: 6,
      }),
    ]);

  const revenue = (paidAggregate._sum.total as number | null) ?? 0;
  const revenueValue = revenue > 0 ? formatINR(revenue) : "₹0";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">A quick pulse on the store.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (paid)" value={revenueValue} icon="star" tone="blue" />
        <StatCard label="Orders" value={String(orderCount)} icon="box" tone="peach" />
        <StatCard label="Products" value={String(productCount)} icon="bag" tone="neutral" />
        <StatCard label="Customers" value={String(customerCount)} icon="user" tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
              Recent orders
            </h2>
            <Link href="/admin/orders" className="text-sm font-medium text-ayli-blue hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="rounded-card border border-dashed border-hairline px-4 py-8 text-center text-sm text-muted">
              No orders yet.
            </p>
          ) : (
            <ul className="divide-y divide-hairline/70">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-soft-beige/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        #{order.orderNumber}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {order.user.name ?? order.user.email} · {order.items.length} item
                        {order.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-ink">
                        {formatINR(Number(order.total))}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
              Out of stock
            </h2>
            <Link href="/admin/inventory" className="text-sm font-medium text-ayli-blue hover:underline">
              Inventory
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="rounded-card border border-dashed border-hairline px-4 py-8 text-center text-sm text-muted">
              Nothing out of stock. Great job.
            </p>
          ) : (
            <ul className="divide-y divide-hairline/70">
              {lowStock.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {inv.variant.product.name}
                    </span>
                    <span className="block text-xs text-muted">
                      {inv.variant.colour} · {inv.variant.size}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-pill bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger">
                    {inv.stockQuantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/products/new" className={buttonClasses({ size: "md" })}>
          Add product
        </Link>
        <Link href="/admin/orders" className={buttonClasses({ variant: "secondary", size: "md" })}>
          Manage orders
        </Link>
      </div>
    </div>
  );
}