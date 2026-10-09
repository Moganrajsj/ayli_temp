"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/cart-store";
import { mergeGuestCart } from "@/actions/cart.action";
import { useToast } from "@/components/ui/toast";
import { dispatchCartUpdated } from "@/components/cart/cart-badge";

// Mounted once at the app root. When a user signs in, any localStorage guest
// cart rows are merged into their server cart (quantities summed, capped at
// stock — see actions/cart.action.ts) and the local store is cleared.
export function GuestCartMerger() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      mergedFor.current = null;
      return;
    }
    const userId = session?.user?.id;
    if (status !== "authenticated" || !userId) return;
    if (mergedFor.current === userId) return;
    mergedFor.current = userId;

    const items = useCartStore.getState().items;
    if (items.length === 0) return;

    let cancelled = false;
    void (async () => {
      // Small delay to ensure session JWT is fully hydrated after Google OAuth redirect.
      // Without this, mergeGuestCart() may see user=null and silently skip the merge.
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      if (cancelled) return;

      // Re-read items after delay (in case store changed while waiting)
      const snapshot = useCartStore.getState().items;
      if (snapshot.length === 0) return;

      try {
        const result = await mergeGuestCart(snapshot);
        if (cancelled) return;
        if (result.ok) {
          // Only clear localStorage after server confirms successful merge
          useCartStore.getState().clear();
          dispatchCartUpdated();
          if ((result.merged ?? 0) > 0) {
            toast("Your saved items have moved into your bag", "success");
          }
        }
        // If result.ok is false, keep localStorage intact — items are not lost
      } catch {
        // Network/server error — keep localStorage intact so user doesn't lose cart
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id, toast]);

  return null;
}