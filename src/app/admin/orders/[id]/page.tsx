import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusUpdate } from "@/components/admin/order-status-update";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(0, 8)}…` };
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      address: true,
      items: true,
    },
  });
  if (!order) notFound();

  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            #{order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed {formatDate(order.createdAt)} by {order.user.name ?? order.user.email}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {/* Items */}
          <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
            <h2 className="mb-4 font-display text-base font-semibold tracking-tight text-ink">
              Items ({itemCount})
            </h2>
            <ul className="divide-y divide-hairline/70">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  <span className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-card bg-soft-beige">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center">
                        <Icon name="sparkles" className="h-4 w-4 text-ayli-blue/40" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                    <span className="block text-xs text-muted">
                      {item.colour} · {item.size} × {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {formatINR(Number(item.total))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Totals + address */}
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="text-ink">{formatINR(Number(order.subtotal))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="text-success">−{formatINR(Number(order.discount))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="text-ink">{Number(order.shipping) === 0 ? "Free" : formatINR(Number(order.shipping))}</dd>
                </div>
                <div className="flex justify-between border-t border-hairline/70 pt-3 text-base">
                  <dt className="font-medium text-ink">Total</dt>
                  <dd className="font-display font-semibold text-ink">{formatINR(Number(order.total))}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Delivery</h2>
              <p className="text-sm font-medium text-ink">{order.address.name}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ""}
                {"\n"}
                {order.address.city}, {order.address.state} — {order.address.pincode}
                {"\n"}
                +91 {order.address.phone}
              </p>
            </section>
          </div>

          <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Payment</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Status</dt>
                <dd className="font-medium text-ink">{order.paymentStatus}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Method</dt>
                <dd className="font-medium capitalize text-ink">{order.paymentMethod ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Gateway order</dt>
                <dd className="font-medium text-ink">{order.paymentOrderId ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Payment id</dt>
                <dd className="font-medium text-ink break-all">{order.paymentId ?? "—"}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Sidebar: status update */}
        <aside className="order-first xl:order-none">
          <div className="sticky top-24">
            <OrderStatusUpdate
              orderId={order.id}
              currentStatus={order.status}
              trackingNumber={order.trackingNumber}
              notes={order.notes}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}