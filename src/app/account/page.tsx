import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon, type IconName } from "@/components/ui/icons";
import { formatDate, formatINR } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { AnimateOnMount } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "My account",
};

function StatTile({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center rounded-card border border-hairline bg-warm-white px-3 py-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-ayli-blue/30 hover:shadow-soft sm:py-6"
    >
      <span className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl animate-fade-in">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted sm:text-sm">
        {label}
      </span>
    </Link>
  );
}

function QuickLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-soft-beige/60 sm:px-5 sm:py-5"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-soft-beige text-ayli-blue">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-medium uppercase tracking-wide text-ink">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted">{subtitle}</span>
      </span>
      <Icon
        name="chevron-right"
        className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function RecentOrderStatus({ status }: { status: string }) {
  if (status === "DELIVERED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
        <Icon name="check" className="h-3.5 w-3.5" />
        Delivered
      </span>
    );
  }
  return <OrderStatusBadge status={status} />;
}

function RecentOrderCard({
  orderNumber,
  createdAt,
  status,
  item,
}: {
  orderNumber: string;
  createdAt: Date;
  status: string;
  item?: { name: string; image: string | null; colour: string; size: string; quantity: number; total: string };
}) {
  return (
    <section
      aria-label="Your orders"
      className="rounded-card border border-hairline bg-warm-white p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline/70 pb-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          Your recent order
        </h2>
        <Link
          href="/account/orders"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ayli-blue hover:underline"
        >
          View all
          <Icon name="arrow-right" className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!item ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-soft-beige text-ayli-blue">
            <Icon name="box" className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-medium text-ink">No orders yet</p>
          <p className="max-w-xs text-sm text-muted">
            When you place an order it will show up here with live status.
          </p>
          <Link
            href="/"
            className="mt-1 inline-flex h-11 items-center rounded-pill bg-ayli-blue px-6 text-[15px] font-medium text-white shadow-soft transition-colors hover:bg-[#1ba9bc]"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <Link
          href={`/order/${orderNumber}`}
          className="group mt-4 block rounded-card border border-hairline/70 p-4 transition-colors hover:border-ayli-blue/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-base font-medium text-ink">
                #{orderNumber}
              </p>
              <p className="mt-0.5 text-xs text-muted">{formatDate(createdAt)}</p>
            </div>
            <RecentOrderStatus status={status} />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <span className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-card bg-soft-beige">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover animate-fade-in" />
              ) : (
                <span className="grid h-full w-full place-items-center">
                  <Icon name="sparkles" className="h-4 w-4 text-ayli-blue/40" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {item.colour} · {item.size} × {item.quantity}
              </span>
              <span className="mt-1.5 block font-display text-lg font-semibold text-ink">
                {formatINR(Number(item.total))}
              </span>
            </span>
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ayli-blue">
            View order
            <Icon
              name="arrow-right"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      )}
    </section>
  );
}

export default async function AccountHomePage() {
  const session = await auth();
  const user = session?.user;

  const [freshUser, ordersCount, wishlist, addressesCount, recentOrder] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user?.id ?? "" },
      select: { name: true, email: true, phone: true, role: true },
    }),
    prisma.order.count({ where: { userId: user?.id ?? "" } }),
    prisma.wishlist.findUnique({
      where: { userId: user?.id ?? "" },
      select: { _count: { select: { items: true } } },
    }),
    prisma.address.count({ where: { userId: user?.id ?? "" } }),
    prisma.order.findFirst({
      where: { userId: user?.id ?? "" },
      orderBy: { createdAt: "desc" },
      include: { items: { take: 1 } },
    }),
  ]);

  const name = freshUser?.name ?? user?.name ?? "there";
  const firstName = name.split(" ")[0];
  const wishlistCount = wishlist?._count.items ?? 0;

  const recentItem = recentOrder?.items[0]
    ? {
        name: recentOrder.items[0].name,
        image: recentOrder.items[0].image,
        colour: recentOrder.items[0].colour,
        size: recentOrder.items[0].size,
        quantity: recentOrder.items[0].quantity,
        total: String(recentOrder.items[0].total),
      }
    : undefined;

  return (
    <div>
      <AnimateOnMount animation="animate-fade-up" className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          My AYLI
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Hello, {firstName}{" "}
          <Icon name="sparkles" className="inline h-8 w-8 text-ayli-peach sm:h-9 sm:w-9" />
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted sm:text-base">
          Welcome back to your AYLI space.
        </p>
      </AnimateOnMount>

      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <StatTile href="/account/orders" label="Orders" value={ordersCount} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "220ms" }}>
          <StatTile href="/wishlist" label="Wishlist" value={wishlistCount} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "320ms" }}>
          <StatTile href="/account/addresses" label="Addresses" value={addressesCount} />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-card border border-hairline bg-warm-white">
            <QuickLink href="/account/orders" icon="box" title="Orders" subtitle="Track purchases" />
            <QuickLink href="/wishlist" icon="heart" title="Your AYLI edit" subtitle="Saved favourites" />
            <QuickLink href="/account/addresses" icon="map-pin" title="Addresses" subtitle="Delivery addresses" />
            <QuickLink href="/account/profile" icon="edit" title="Profile" subtitle="Personal details" />
            {freshUser?.role === "ADMIN" ? (
              <QuickLink href="/admin" icon="briefcase" title="Admin" subtitle="Products, orders & inventory" />
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-7">
          {recentOrder ? (
            <RecentOrderCard
              orderNumber={recentOrder.orderNumber}
              createdAt={recentOrder.createdAt}
              status={recentOrder.status}
              item={recentItem}
            />
          ) : (
            <RecentOrderCard orderNumber="" createdAt={new Date()} status="" item={undefined} />
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-center lg:hidden">
        <Link
          href="/"
          className="inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-pill bg-ayli-blue px-8 text-[15px] font-medium text-white shadow-soft transition-colors hover:bg-[#1ba9bc]"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}