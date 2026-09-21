"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  getOrCreateCart,
  getServerCartCount,
  MAX_LINE_QTY,
} from "@/lib/cart";

interface ActionUser {
  id: string;
}

async function currentUser(): Promise<ActionUser | null> {
  const session = await auth();
  return session?.user?.id ? { id: session.user.id } : null;
}

export interface CartActionResult {
  ok: boolean;
  message?: string;
  count?: number;
  merged?: number;
}

function capQuantity(requested: number, available: number): number {
  if (available <= 0) return 0;
  return Math.max(1, Math.min(MAX_LINE_QTY, requested, available));
}

async function availableStock(variantId: string): Promise<number | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      isActive: true,
      product: { select: { isActive: true } },
      inventory: { select: { stockQuantity: true, reservedQuantity: true } },
    },
  });
  if (!variant || !variant.isActive || !variant.product.isActive) return null;
  return Math.max(
    0,
    (variant.inventory?.stockQuantity ?? 0) - (variant.inventory?.reservedQuantity ?? 0)
  );
}

export async function addToCart(
  variantId: string,
  quantity: number
): Promise<CartActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Please sign in to add to your bag." };

  const qty = Math.floor(quantity);
  if (!variantId || !Number.isFinite(qty) || qty < 1 || qty > MAX_LINE_QTY) {
    return { ok: false, message: "Invalid quantity." };
  }

  const available = await availableStock(variantId);
  if (available === null) return { ok: false, message: "This option is no longer available." };
  if (available <= 0) return { ok: false, message: "This option is out of stock." };

  const add = capQuantity(qty, available);
  const cart = await getOrCreateCart(user.id);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    if (existing) {
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(MAX_LINE_QTY, existing.quantity + add) },
      });
    } else {
      await tx.cartItem.create({ data: { cartId: cart.id, variantId, quantity: add } });
    }
  });

  return { ok: true, count: await getServerCartCount(user.id) };
}

export async function updateCartItem(
  cartItemId: string,
  quantity: number
): Promise<CartActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const qty = Math.floor(quantity);
  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId: user.id } },
    select: { id: true, variantId: true },
  });
  if (!item) return { ok: false, message: "Item not found in your bag." };

  if (qty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return { ok: true, count: await getServerCartCount(user.id) };
  }

  const available = await availableStock(item.variantId);
  if (available === null || available <= 0) {
    return { ok: false, message: "This option is out of stock." };
  }

  const next = capQuantity(qty, available);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: next } });
  return { ok: true, count: await getServerCartCount(user.id) };
}

export async function removeCartItem(cartItemId: string): Promise<CartActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId: user.id } },
    select: { id: true },
  });
  if (item) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  }
  return { ok: true, count: await getServerCartCount(user.id) };
}

export async function clearServerCart(): Promise<CartActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return { ok: true, count: 0 };
}

// Merge the guest (localStorage) cart into the server cart on login. Same
// variant ⇒ quantities sum, capped at live stock; rows that are inactive or
// out of stock are dropped (nothing is silently kept beyond availability).
export async function mergeGuestCart(
  items: Array<{ variantId: string; quantity: number }>
): Promise<CartActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  if (!Array.isArray(items) || items.length > 50) {
    return { ok: false, message: "Invalid cart data." };
  }

  const sanitized = items
    .filter(
      (item) =>
        typeof item?.variantId === "string" &&
        Number.isFinite(item.quantity) &&
        item.quantity >= 1
    )
    .slice(0, 50);

  const cart = await getOrCreateCart(user.id);
  let merged = 0;

  for (const item of sanitized) {
    const available = await availableStock(item.variantId);
    if (available === null || available <= 0) continue;

    const add = capQuantity(item.quantity, available);
    await prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
      });
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(MAX_LINE_QTY, existing.quantity + add) },
        });
      } else {
        await tx.cartItem.create({
          data: { cartId: cart.id, variantId: item.variantId, quantity: add },
        });
      }
    });
    merged += 1;
  }

  return { ok: true, merged, count: await getServerCartCount(user.id) };
}