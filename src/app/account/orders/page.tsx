import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/icons";
import { AccountBreadcrumb } from "@/components/account/account-breadcrumb";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
};

function OrderStatusBadge({ status }: { status: string }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ");
  return (
    <span className="rounded-pill bg-soft-beige px-2.5 py-1 text-xs font-semibold text-ink">
      {label}
    </span>
  );
}

export default async function OrdersPage() {
  const session = await auth();

  const orders = await prisma.order.findMany({
    where: { userId: session?.user?.id ?? "" },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="mb-1 font-display text-2xl font-semibold tracking-tight text-ink">
          Orders
        </h2>
        <p className="mb-6 text-sm text-muted">Your AYLI order history.</p>

        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline bg-warm-white px-6 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-soft-beige text-ayli-blue">
            <Icon name="box" className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-medium text-ink">No orders yet</p>
          <p className="max-w-xs text-sm text-muted">
            When you place an order it will show up here with live status tracking.
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex h-11 items-center rounded-pill bg-ayli-blue px-6 text-[15px] font-medium text-white shadow-soft transition-colors hover:bg-[#1ba9bc]"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountBreadcrumb page="Orders" />
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight text-ink">
        Orders
      </h1>
      <p className="mb-6 text-sm text-muted">
        {orders.length} order{orders.length === 1 ? "" : "s"}.
      </p>

      <div className="flex flex-col gap-4">
        {orders.map((order) => {
          const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
          return (
            <Link
              key={order.id}
              href={`/order/${order.orderNumber}`}
              className="block rounded-card border border-hairline bg-warm-white p-5 transition-colors hover:border-ayli-blue/40"
            >
              <div className="flex items-center justify-between gap-3 border-b border-hairline/70 pb-3">
                <div>
                  <p className="font-display text-base font-medium text-ink">
                    #{order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(order.createdAt)} · {itemCount} item
                    {itemCount === 1 ? "" : "s"}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="pt-3">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-ink">
                      {item.name}{" "}
                      <span className="text-muted">
                        ({item.colour}, {item.size} × {item.quantity})
                      </span>
                    </span>
                    <span className="shrink-0 font-medium text-ink">
                      {formatINR(Number(item.total))}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 ? (
                  <p className="mt-1 text-sm text-muted">
                    +{order.items.length - 3} more item
                    {order.items.length - 3 === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-hairline/70 pt-3">
                <span className="text-sm text-muted">Total</span>
                <span className="font-display text-lg font-semibold text-ink">
                  {formatINR(Number(order.total))}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}