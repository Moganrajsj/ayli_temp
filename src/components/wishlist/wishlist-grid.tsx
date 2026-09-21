"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid } from "@/components/product/product-grid";
import { removeWishlistItem } from "@/actions/wishlist.action";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button";
import type { WishlistEntry } from "@/lib/wishlist";

export function WishlistGrid({ entries }: { entries: WishlistEntry[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(entries);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const remove = (id: string) => {
    setPendingId(id);
    void removeWishlistItem(id).then((result) => {
      setPendingId(null);
      if (result.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      } else {
        toast(result.message ?? "Could not remove this item.", "error");
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline bg-warm-white px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-soft-beige text-ayli-blue">
          <Icon name="heart" className="h-7 w-7" />
        </span>
        <p className="font-display text-lg font-medium text-ink">
          Nothing saved yet
        </p>
        <p className="max-w-xs text-sm text-muted">
          Tap the heart on any product to build your AYLI Edit.
        </p>
        <Link
          href="/"
          className={buttonClasses({ className: "mt-2" })}
        >
          Start exploring
        </Link>
      </div>
    );
  }

  return (
    <ProductGrid>
      {items.map((entry) => (
        <div key={entry.id} className="relative">
          <ProductCard product={entry.product} />
          <button
            type="button"
            aria-label={`Remove ${entry.product.name} from wishlist`}
            disabled={pendingId === entry.id}
            onClick={() => remove(entry.id)}
            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-warm-white/95 text-ayli-blue shadow-sm backdrop-blur transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Icon name="heart" solid className="h-4 w-4" />
          </button>
        </div>
      ))}
    </ProductGrid>
  );
}