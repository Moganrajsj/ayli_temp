"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useCartStore, selectCartCount } from "@/lib/cart-store";

export function CartBadge() {
  const { data: session } = useSession();
  const guestCount = useCartStore(selectCartCount);
  const [serverCount, setServerCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart/count", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setServerCount(typeof data?.count === "number" ? data.count : 0);
    } catch {
      // stay on previous count
    }
  }, []);

  // Re-fetch after any cart-updated event (dispatched by AddToBag / cart actions)
  useEffect(() => {
    if (!session?.user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerCount(0);
      return;
    }
    fetchCount();
    const handler = () => fetchCount();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [session?.user?.id, fetchCount]);

  // Also refresh on route change in case the page render caused a mutation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCount();
  }, [fetchCount]);

  const count = session?.user?.id ? serverCount : guestCount;
  if (count <= 0) return null;
  return (
    <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ayli-blue px-1 text-[10px] font-bold leading-none text-white shadow-sm">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function dispatchCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}