"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn, formatINR } from "@/lib/utils";
import type { CartLine, CartTotals, SerializedCart } from "@/lib/cart";
import { useCartStore } from "@/lib/cart-store";
import { updateCartItem, removeCartItem } from "@/actions/cart.action";
import { dispatchCartUpdated } from "@/components/cart/cart-badge";
import { Icon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface CartViewProps {
  mode: "user" | "guest";
  initial?: SerializedCart;
}

function CartLineRow({
  line,
  onQuantityChange,
  onRemove,
  pending,
  updating,
}: {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  pending?: boolean;
  updating?: boolean;
}) {
  const [leaving, setLeaving] = useState(false);

  const handleRemove = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onRemove, 320);
  };

  return (
    <li
      className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        leaving ? "max-h-0 opacity-0 py-0" : "max-h-64 py-5"
      )}
    >
      <div className="flex gap-4">
      <Link
        href={`/product/${line.productSlug}`}
        className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-card bg-soft-beige"
      >
        {line.image ? (
          <Image
            src={line.image}
            alt={line.name}
            fill
            sizes="96px"
            className="object-cover animate-fade-in"
          />
        ) : (
          <span className="grid h-full w-full place-items-center">
            <Icon name="sparkles" className="h-6 w-6 text-ayli-blue/40" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/product/${line.productSlug}`}
            className="text-sm font-medium leading-snug text-ink hover:text-ayli-blue"
          >
            {line.name}
          </Link>
          <button
            type="button"
            aria-label="Remove item"
            onClick={handleRemove}
            disabled={pending}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-soft-beige hover:text-ink disabled:opacity-40"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-xs text-muted">
          {line.colour} · {line.size}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-ink">
            {formatINR(line.unitSelling)}
          </span>
          {line.unitMrp > line.unitSelling ? (
            <>
              <span className="text-xs text-muted line-through">
                {formatINR(line.unitMrp)}
              </span>
              <span className="rounded-pill bg-peach/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#c2552d]">
                {line.discountPercent}% off
              </span>
            </>
          ) : null}
        </div>

        {!line.availableNow ? (
          <p className="mt-2 text-xs font-medium text-[#c2552d]">
            Out of stock — please remove
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="inline-flex items-center rounded-card border border-hairline">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={pending || updating || line.quantity <= 1}
              onClick={() => onQuantityChange(line.quantity - 1)}
              className="grid h-9 w-9 place-items-center text-ink transition-colors hover:bg-soft-beige disabled:text-muted/40"
            >
              <Icon name="minus" className="h-4 w-4" />
            </button>
            <span
              key={line.quantity}
              aria-live="polite"
              className="inline-block w-9 text-center text-sm font-semibold animate-pop-in"
            >
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={
                pending || updating || line.maxQty <= 0 || line.quantity >= line.maxQty
              }
              onClick={() => onQuantityChange(line.quantity + 1)}
              className="grid h-9 w-9 place-items-center text-ink transition-colors hover:bg-soft-beige disabled:text-muted/40"
            >
              <Icon name="plus" className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm font-semibold text-ink">
            {formatINR(line.lineSelling)}
          </span>
        </div>
      </div>
    </div>
    </li>
  );
}

function TotalsPanel({
  totals,
  highlight = false,
}: {
  totals: CartTotals;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-card border border-hairline bg-warm-white p-5">
      <p className="font-display text-lg font-medium text-ink">Order summary</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">MRP</dt>
          <dd className="text-ink">{formatINR(totals.mrpTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Discount</dt>
          <dd className="font-medium text-[#2e9e6d]">
            −{formatINR(totals.savings)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd className="text-ink">
            {totals.shippingFree ? "Free" : formatINR(totals.shipping)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-hairline/70 pt-3 text-base">
          <dt className="font-medium text-ink">Total</dt>
          <dd className={cn("font-display font-semibold", highlight ? "text-ayli-blue" : "text-ink")}>
            {formatINR(totals.grandTotal)}
          </dd>
        </div>
      </dl>
      {totals.shippingNote ? (
        <p className="mt-3 text-xs text-muted">{totals.shippingNote}</p>
      ) : null}
    </div>
  );
}

function EmptyBag({ mode }: { mode: "user" | "guest" }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline bg-warm-white px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-soft-beige text-ayli-blue">
        <Icon name="bag" className="h-7 w-7" />
      </span>
      <p className="font-display text-lg font-medium text-ink">Your bag is empty</p>
      <p className="max-w-xs text-sm text-muted">
        {mode === "guest"
          ? "Everything you add here is saved on this device until you sign in."
          : "Discover pieces that feel like you and they'll appear here."}
      </p>
      <Link
        href="/"
        className={buttonClasses({ className: "mt-2" })}
      >
        Start shopping
      </Link>
    </div>
  );
}

export function CartView({ mode, initial }: CartViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const guestItems = useCartStore((s) => s.items);
  const [guestPreview, setGuestPreview] = useState<SerializedCart | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "guest") return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/cart/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: guestItems }),
          cache: "no-store",
        });
        if (!response.ok) return;
        const data: SerializedCart = await response.json();
        if (!cancelled) setGuestPreview(data);
      } catch {
        // ignore transient network errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, guestItems]);

  const guestQtyChange = (variantId: string, quantity: number) => {
    useCartStore.getState().setQuantity(variantId, quantity);
    dispatchCartUpdated();
  };
  const guestRemove = (variantId: string) => {
    useCartStore.getState().removeItem(variantId);
    dispatchCartUpdated();
  };

  const userQtyChange = (itemId: string, quantity: number) => {
    setUpdatingId(itemId);
    startTransition(async () => {
      const result = await updateCartItem(itemId, quantity);
      if (result.ok) {
        router.refresh();
        dispatchCartUpdated();
      } else {
        toast(result.message ?? "Could not update this item.", "error");
        setUpdatingId(null);
      }
    });
  };
  const userRemove = (itemId: string) => {
    setUpdatingId(itemId);
    startTransition(async () => {
      const result = await removeCartItem(itemId);
      if (result.ok) {
        router.refresh();
        dispatchCartUpdated();
      } else {
        toast(result.message ?? "Could not remove this item.", "error");
        setUpdatingId(null);
      }
    });
  };

  const lines: CartLine[] =
    mode === "guest" ? guestPreview?.lines ?? [] : initial?.lines ?? [];
  const totals: CartTotals | null =
    mode === "guest" ? guestPreview?.totals ?? null : initial?.totals ?? null;
  const isEmpty = lines.length === 0;
  const loading =
    mode === "guest" && guestPreview === null && guestItems.length > 0;

  return (
    <div className="pb-24 lg:pb-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Your Bag
          </h1>
          <p className="mt-1 text-sm text-muted">
            {totals ? `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}` : "Your AYLI picks"}
          </p>
        </div>
        {mode === "guest" ? (
          <Link
            href="/signin?callbackUrl=/cart"
            className="text-sm font-medium text-ayli-blue hover:text-[#1496a8]"
          >
            Sign in to save
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-col gap-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex gap-4 animate-pulse py-5"
            >
              <div className="aspect-[4/5] w-24 rounded-card bg-soft-beige" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 w-2/3 rounded bg-soft-beige" />
                <div className="h-3 w-1/3 rounded bg-soft-beige" />
                <div className="h-3 w-1/2 rounded bg-soft-beige" />
              </div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyBag mode={mode} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <ul className="divide-y divide-hairline/70">
            {lines.map((line) => (
              <CartLineRow
                key={mode === "guest" ? line.variantId : line.id}
                line={line}
                pending={pending}
                updating={updatingId === line.id}
                onQuantityChange={(q) =>
                  mode === "guest"
                    ? guestQtyChange(line.variantId, q)
                    : userQtyChange(line.id!, q)
                }
                onRemove={() =>
                  mode === "guest"
                    ? guestRemove(line.variantId)
                    : userRemove(line.id!)
                }
              />
            ))}
          </ul>

          <div className="space-y-4 lg:sticky lg:top-24">
            {totals ? <TotalsPanel totals={totals} /> : null}
            <p className="flex items-center gap-2 rounded-card bg-soft-beige px-4 py-3 text-xs text-muted">
              <Icon name="truck" className="h-4 w-4 shrink-0 text-ayli-blue" />
              Dispatch within 24 hours · 15-day easy returns
            </p>
          </div>
        </div>
      )}

      {!isEmpty && totals ? (
        <div className="fixed inset-x-0 bottom-20 z-30 border-t border-hairline bg-warm-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Total</p>
              <p className="text-base font-semibold text-ink">
                {formatINR(totals.grandTotal)}
              </p>
            </div>
            <Link
              href={mode === "guest" ? "/signin?callbackUrl=/checkout" : "/checkout"}
              className={buttonClasses({ size: "lg", className: "flex-1 justify-center" })}
            >
              {mode === "guest" ? "Sign in to check out" : "Checkout"}
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}

      {!isEmpty && totals ? (
        <div className="mt-8 hidden lg:block">
          <Link
            href={mode === "guest" ? "/signin?callbackUrl=/checkout" : "/checkout"}
            className={buttonClasses({ size: "lg", className: "w-full justify-center" })}
          >
            {mode === "guest" ? "Sign in to check out" : "Checkout"}
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}