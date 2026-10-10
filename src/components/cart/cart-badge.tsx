"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCartStore, selectCartCount } from "@/lib/cart-store";

// ── Coalesced server-cart-count fetch ────────────────────────────────────────
// CartBadge renders in several places (desktop header, mobile header, bottom
// nav). Without coalescing, every instance would fetch /api/cart/count on mount
// and on every navigation, multiplying MySQL queries for signed-in shoppers.
// A single module-level cache + in-flight promise collapses those into one
// request, and a short TTL avoids re-querying on rapid navigations. This keeps
// usage under Hostinger's `max_connections_per_hour` cap.
const COUNT_TTL_MS = 15_000;

let countCache = { value: 0, at: 0 };
let countInflight: Promise<number> | null = null;

async function fetchServerCartCount(force = false): Promise<number> {
  const now = Date.now();
  if (!force && countCache.at && now - countCache.at < COUNT_TTL_MS) {
    return countCache.value;
  }
  if (countInflight) return countInflight;

  countInflight = (async () => {
    try {
      const res = await fetch("/api/cart/count", { cache: "no-store" });
      if (!res.ok) return countCache.value;
      const data = await res.json();
      const value = typeof data?.count === "number" ? data.count : 0;
      countCache = { value, at: Date.now() };
      return value;
    } catch {
      // Network/server error — keep the previous count.
      return countCache.value;
    } finally {
      countInflight = null;
    }
  })();

  return countInflight;
}

export function CartBadge() {
  const { data: session } = useSession();
  const guestCount = useCartStore(selectCartCount);
  const pathname = usePathname();
  const [serverCount, setServerCount] = useState(countCache.value);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerCount(0);
      return;
    }

    let cancelled = false;
    const load = (force = false) => {
      void fetchServerCartCount(force).then((value) => {
        if (!cancelled) setServerCount(value);
      });
    };

    // Refresh on navigation (served from the TTL cache within 15s) and after any
    // cart mutation dispatched by AddToBag / cart actions.
    load();
    const handler = () => load(true);
    window.addEventListener("cart-updated", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("cart-updated", handler);
    };
  }, [userId, pathname]);

  const count = userId ? serverCount : guestCount;
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
