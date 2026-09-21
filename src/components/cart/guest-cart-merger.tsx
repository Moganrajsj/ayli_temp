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
      const result = await mergeGuestCart(items);
      if (cancelled) return;
      if (result.ok) {
        useCartStore.getState().clear();
        dispatchCartUpdated();
        if ((result.merged ?? 0) > 0) {
          toast("Your saved items have moved into your bag", "success");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id, toast]);

  return null;
}