// Client-only guest cart. Persisted to localStorage via zustand persist; the
// server cart (Cart/CartItem rows) is the source of truth once signed in and
// guest rows are merged on login (see actions/cart.action.ts).
"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface GuestCartItem {
  variantId: string;
  quantity: number;
}

interface CartState {
  items: GuestCartItem[];
  addItem: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
}

const MAX_QTY = 5;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (variantId, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === variantId);
          const next = Math.min(MAX_QTY, quantity);
          if (!existing) {
            return { items: [...state.items, { variantId, quantity: next }] };
          }
          return {
            items: state.items.map((i) =>
              i.variantId === variantId
                ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) }
                : i
            ),
          };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId
                    ? { ...i, quantity: Math.min(MAX_QTY, quantity) }
                    : i
                ),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "ayli-guest-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : (null as unknown as Storage)
      ),
      version: 1,
    }
  )
);

export const selectCartCount = (state: CartState): number =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);