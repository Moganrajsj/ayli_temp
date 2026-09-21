import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { buttonClasses } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

const CONFIRMED = new Set(["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"]);

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/account/orders");

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: { items: true, address: true },
  });
  if (!order) notFound();

  const isConfirmed = CONFIRMED.has(order.status);
  const isCancelled = order.status === "CANCELLED";
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="pt-6">
      <PageContainer className="max-w-3xl">
        {/* status header */}
        <div className="animate-pop-in rounded-card border border-hairline bg-warm-white p-6 text-center sm:p-8">
          <span
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
              isConfirmed
                ? "bg-success/10 text-[#2e9e6d]"
                : isCancelled
                  ? "bg-danger/10 text-[#D95C5C]"
                  : "bg-soft-beige text-muted"
            }`}
          >
            {isConfirmed ? (
              <Icon
                name="check"
                className="h-8 w-8 animate-check-draw"
                style={{ strokeDasharray: 24 }}
              />
            ) : (
              <Icon name={isCancelled ? "x" : "box"} className="h-8 w-8" />
            )}
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
            {isConfirmed ? "Order confirmed" : isCancelled ? "Order cancelled" : "Order placed"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isConfirmed
              ? `We're getting your pieces ready. Your order #${order.orderNumber} is on its way.`
              : isCancelled
                ? `No payment was captured for #${order.orderNumber}.`
                : `Your order #${order.orderNumber} is awaiting payment.`}
          </p>

          <dl className="mx-auto mt-6 max-w-sm space-y-1.5 text-sm animate-stagger-fade" style={{ animationDelay: "0.18s" }}>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Order number</dt>
              <dd className="font-medium text-ink">#{order.orderNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Placed on</dt>
              <dd className="font-medium text-ink">{formatDate(order.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Payment</dt>
              <dd className="font-medium text-ink">
                {order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus === "FAILED" ? "Failed" : "Pending"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Method</dt>
              <dd className="font-medium capitalize text-ink">{order.paymentMethod ?? "—"}</dd>
            </div>
          </dl>
        </div>

        {/* status timeline */}
        <section aria-label="Order status timeline" className="mt-6 animate-fade-up rounded-card border border-hairline bg-warm-white p-5 sm:p-6" style={{ animationDelay: "0.28s" }}>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">Order status</p>
          <OrderStatusTimeline
            status={order.status}
            shippedAt={order.shippedAt}
            deliveredAt={order.deliveredAt}
          />
        </section>

        {/* items */}
        <section aria-label="Items" className="mt-6">
          <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-ink">
            Items ({itemCount})
          </h2>
          <ul className="divide-y divide-hairline/70 rounded-card border border-hairline bg-warm-white px-4">
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
                    {item.colour} · {item.size} · Qty {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {formatINR(Number(item.total))}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* address + totals */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section aria-label="Delivery address" className="rounded-card border border-hairline bg-warm-white p-5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-muted">
              <Icon name="map-pin" className="h-4 w-4" />
              Deliver to
            </p>
            <p className="text-sm font-medium text-ink">{order.address.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
              <br />
              {order.address.city}, {order.address.state} — {order.address.pincode}
              <br />
              +91 {order.address.phone}
            </p>
          </section>

          <section aria-label="Order summary" className="rounded-card border border-hairline bg-warm-white p-5">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Order summary</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">MRP</dt>
                <dd className="text-ink">{formatINR(Number(order.subtotal) + Number(order.discount))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd className="font-medium text-[#2e9e6d]">−{formatINR(Number(order.discount))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="text-ink">
                  {Number(order.shipping) === 0 ? "Free" : formatINR(Number(order.shipping))}
                </dd>
              </div>
              <div className="flex justify-between border-t border-hairline/70 pt-3 text-base">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-display font-semibold text-ink">{formatINR(Number(order.total))}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className={buttonClasses({ size: "lg", className: "flex-1 justify-center" })}>
            Continue shopping
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
          <Link
            href="/account/orders"
            className={buttonClasses({ variant: "secondary", size: "lg", className: "flex-1 justify-center" })}
          >
            View all orders
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}