"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn, formatINR } from "@/lib/utils";
import type { PdpVariant } from "@/lib/catalog";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { buttonClasses } from "@/components/ui/button";
import { VariantSelector } from "@/components/product/variant-selector";
import { useCartStore } from "@/lib/cart-store";
import { addToCart } from "@/actions/cart.action";
import { dispatchCartUpdated } from "@/components/cart/cart-badge";

export interface AddToBagProps {
  productName: string;
  variants: PdpVariant[];
  basePrice: number;
  selectedColour?: string | null;
  onSelectColour?: (colour: string) => void;
  className?: string;
}

/**
 * PDP buy box: variant selection + quantity + Add-to-Bag / Go-to-Bag.
 * Guests write to localStorage cart; signed-in users add server-side.
 * Behavior matches Myntra: when added, button transitions to "Go to Bag"
 * with no interrupting popup so customers can continue browsing freely.
 */
export function AddToBag({
  productName,
  variants,
  basePrice,
  selectedColour: controlledColour,
  onSelectColour: setControlledColour,
  className,
}: AddToBagProps) {
  const { toast } = useToast();
  const { status } = useSession();

  // Smart Default Color Selection: Find the 1st color tone with available stock.
  const defaultColour = useMemo(() => {
    const colours = [...new Set(variants.map((v) => v.colour))];
    const firstAvailable = colours.find((c) =>
      variants.some((v) => v.colour === c && v.availability.available)
    );
    return firstAvailable ?? colours[0] ?? null;
  }, [variants]);

  const [internalColour, setInternalColour] = useState<string | null>(defaultColour);
  const selectedColour = controlledColour !== undefined ? controlledColour : internalColour;

  const handleColourChange = (colour: string) => {
    setInternalColour(colour);
    setControlledColour?.(colour);
  };

  const [rawSelectedSize, setRawSelectedSize] = useState<string | null>(null);

  const availableSizes = useMemo(() => {
    if (!selectedColour) return [];
    return variants
      .filter((v) => v.colour === selectedColour && v.availability.available)
      .map((v) => v.size);
  }, [selectedColour, variants]);

  // Derive selected size: if raw is valid for this colour, use it; otherwise use 1st available
  const selectedSize =
    rawSelectedSize && availableSizes.includes(rawSelectedSize)
      ? rawSelectedSize
      : availableSizes[0] ?? null;

  const setSelectedSize = (size: string | null) => {
    setRawSelectedSize(size);
  };

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (v) => v.colour === selectedColour && v.size === selectedSize
      ) ?? null,
    [variants, selectedColour, selectedSize]
  );

  // Compute live available stock for selected variant
  const availableStock = useMemo(() => {
    if (!selectedVariant) return 0;
    const stock =
      (selectedVariant.availability.stockQuantity ?? 0) -
      (selectedVariant.availability.reservedQuantity ?? 0);
    return Math.max(0, stock);
  }, [selectedVariant]);

  const maxSelectable = Math.max(1, Math.min(5, availableStock || 1));

  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [addedVariantIds, setAddedVariantIds] = useState<Set<string>>(() => new Set());

  // Initialize guest cart items if unauthenticated
  useEffect(() => {
    if (status !== "authenticated") {
      const guestIds = new Set(useCartStore.getState().items.map((i) => i.variantId));
      setAddedVariantIds(guestIds);
    }
  }, [status]);

  // Auto-clamp quantity if variant changes to one with lower stock
  useEffect(() => {
    if (quantity > maxSelectable) {
      setQuantity(maxSelectable);
    }
  }, [maxSelectable, quantity]);

  const isAdded = Boolean(selectedVariant && addedVariantIds.has(selectedVariant.id));
  const canAdd = Boolean(selectedVariant && selectedVariant.availability.available && availableStock > 0);
  const displayPrice = selectedVariant?.price ?? basePrice;
  const totalPrice = displayPrice * quantity;

  const handleAdd = async () => {
    if (!selectedVariant || !canAdd || availableStock <= 0) {
      toast("Please select an available colour and size", "info");
      return;
    }

    const qtyToAdd = Math.min(quantity, maxSelectable);

    if (status === "authenticated") {
      setPending(true);
      const result = await addToCart(selectedVariant.id, qtyToAdd);
      setPending(false);
      if (result.ok) {
        dispatchCartUpdated();
        setAddedVariantIds((prev) => new Set(prev).add(selectedVariant.id));
        toast("Added to Bag!", "success");
      } else {
        toast(result.message ?? "Could not add to your bag.", "error");
      }
      return;
    }

    useCartStore.getState().addItem(selectedVariant.id, qtyToAdd, availableStock);
    dispatchCartUpdated();
    setAddedVariantIds((prev) => new Set(prev).add(selectedVariant.id));
    toast("Added to Bag!", "success");
  };

  return (
    <div className={cn("space-y-6", className)}>
      <VariantSelector
        variants={variants}
        selectedColour={selectedColour}
        selectedSize={selectedSize}
        onSelectColour={handleColourChange}
        onSelectSize={setSelectedSize}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted">Quantity</p>
            {availableStock > 0 && availableStock <= 5 ? (
              <span className="rounded-pill bg-[#c2552d]/10 px-2 py-0.5 text-[11px] font-semibold text-[#c2552d]">
                Only {availableStock} left
              </span>
            ) : availableStock <= 0 ? (
              <span className="rounded-pill bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                Out of stock
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 inline-flex items-center rounded-card border border-hairline">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1 || availableStock <= 0}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="grid h-10 w-10 place-items-center text-ink transition-colors hover:bg-soft-beige disabled:text-muted/40"
            >
              <Icon name="minus" className="h-4 w-4" />
            </button>
            <span
              aria-live="polite"
              className="w-10 text-center text-sm font-semibold"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={quantity >= maxSelectable || availableStock <= 0}
              onClick={() => setQuantity((q) => Math.min(maxSelectable, q + 1))}
              className="grid h-10 w-10 place-items-center text-ink transition-colors hover:bg-soft-beige disabled:text-muted/40"
            >
              <Icon name="plus" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">Total</p>
          <p className="mt-0.5 text-lg font-semibold text-ink">
            {formatINR(totalPrice)}
          </p>
        </div>
      </div>

      {/* Desktop In-Flow Button: strictly hidden on mobile to avoid duplicate buttons */}
      <div className="hidden lg:block">
        {isAdded ? (
          <Link
            href="/cart"
            className={cn(
              buttonClasses({
                size: "lg",
                className:
                  "w-full justify-center bg-[#2e9e6d] hover:bg-[#258259] text-white shadow-soft transition-all active:scale-[0.97]",
              })
            )}
          >
            <Icon name="bag" className="h-5 w-5" />
            Go to Bag
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending || !canAdd || availableStock <= 0}
            className={cn(
              buttonClasses({
                size: "lg",
                className: "w-full justify-center active:scale-[0.97]",
              })
            )}
          >
            <Icon name="bag" className="h-5 w-5" />
            {pending
              ? "Adding…"
              : availableStock <= 0
                ? "Out of Stock"
                : canAdd
                  ? `Add to Bag — ${formatINR(totalPrice)}`
                  : "Select options"}
          </button>
        )}
      </div>

      {/* Mobile Sticky Bar: strictly visible only on mobile, sits flush at screen bottom */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-warm-white/98 px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted truncate">
              {selectedColour || selectedSize
                ? [selectedColour, selectedSize]
                    .filter(Boolean)
                    .map((v) => String(v))
                    .join(" · ")
                : "Select options"}
            </p>
            <p className="mt-0.5 text-base font-semibold text-ink">
              {formatINR(totalPrice)}
            </p>
          </div>
          {isAdded ? (
            <Link
              href="/cart"
              className={buttonClasses({
                size: "lg",
                className:
                  "flex-1 justify-center bg-[#2e9e6d] hover:bg-[#258259] text-white active:scale-[0.97]",
              })}
            >
              <Icon name="bag" className="h-5 w-5" />
              Go to Bag
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending || !canAdd || availableStock <= 0}
              className={buttonClasses({
                size: "lg",
                className: "flex-1 justify-center active:scale-[0.97]",
              })}
            >
              <Icon name="bag" className="h-5 w-5" />
              {pending
                ? "Adding…"
                : availableStock <= 0
                  ? "Out of stock"
                  : canAdd
                    ? "Add to Bag"
                    : "Select options"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}