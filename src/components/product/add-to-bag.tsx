"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
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
  className?: string;
}

/**
 * PDP buy box: variant selection + quantity + sticky Add-to-Bag bar.
 * Guests write to the localStorage cart; signed-in users add server-side.
 */
export function AddToBag({
  productName,
  variants,
  basePrice,
  className,
}: AddToBagProps) {
  const { toast } = useToast();
  const { status } = useSession();
  const [selectedColour, setSelectedColour] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const flashAdded = () => {
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (v) => v.colour === selectedColour && v.size === selectedSize
      ) ?? null,
    [variants, selectedColour, selectedSize]
  );

  const canAdd = Boolean(selectedVariant && selectedVariant.availability.available);
  const displayPrice = selectedVariant?.price ?? basePrice;
  const totalPrice = displayPrice * quantity;

  const handleAdd = async () => {
    if (!selectedVariant || !canAdd) {
      toast("Select a colour and size to continue", "info");
      return;
    }

    if (status === "authenticated") {
      setPending(true);
      const result = await addToCart(selectedVariant.id, quantity);
      setPending(false);
      if (result.ok) {
        toast(`${productName} added to your bag`, "success");
        dispatchCartUpdated();
        flashAdded();
      } else {
        toast(result.message ?? "Could not add to your bag.", "error");
      }
      return;
    }

    useCartStore.getState().addItem(selectedVariant.id, quantity);
    toast(`${productName} added to your bag`, "success");
    dispatchCartUpdated();
    flashAdded();
  };

  return (
    <div className={cn("space-y-6", className)}>
      <VariantSelector
        variants={variants}
        selectedColour={selectedColour}
        selectedSize={selectedSize}
        onSelectColour={setSelectedColour}
        onSelectSize={setSelectedSize}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Quantity</p>
          <div className="mt-1.5 inline-flex items-center rounded-card border border-hairline">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
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
              disabled={quantity >= 5}
              onClick={() => setQuantity((q) => Math.min(5, q + 1))}
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

      <button
        type="button"
        onClick={handleAdd}
        disabled={pending}
        className={cn(
          buttonClasses({ size: "lg", className: "hidden w-full lg:inline-flex active:scale-[0.97]" })
        )}
      >
        {justAdded ? (
          <Icon name="check" className="h-5 w-5 animate-pop-in" />
        ) : (
          <Icon name="bag" className="h-5 w-5" />
        )}
        {pending ? "Adding…" : justAdded ? "Added to Bag" : canAdd ? `Add to Bag — ${formatINR(totalPrice)}` : "Add to Bag"}
      </button>

      <div className="fixed inset-x-0 bottom-20 z-30 border-t border-hairline bg-warm-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">
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
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending}
            className={buttonClasses({ size: "lg", className: "flex-1 justify-center active:scale-[0.97]" })}
          >
            {justAdded ? (
              <Icon name="check" className="h-5 w-5 animate-pop-in" />
            ) : (
              <Icon name="bag" className="h-5 w-5" />
            )}
            {pending ? "Adding…" : justAdded ? "Added" : canAdd ? "Add to Bag" : "Select"}
          </button>
        </div>
      </div>
    </div>
  );
}