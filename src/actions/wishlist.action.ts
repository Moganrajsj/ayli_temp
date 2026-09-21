"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface WishlistActionResult {
  ok: boolean;
  added?: boolean;
  message?: string;
}

async function assertWishlistUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

export async function toggleWishlist(
  productId: string
): Promise<WishlistActionResult> {
  const userId = await assertWishlistUser();
  if (!userId) {
    return { ok: false, message: "Sign in to save your wishlist." };
  }
  if (!productId) return { ok: false, message: "Invalid product." };

  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: { wishlistId: wishlist.id, productId },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { ok: true, added: false };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true },
  });
  if (!product) return { ok: false, message: "Product not found." };

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId },
  });
  return { ok: true, added: true };
}

export async function removeWishlistItem(
  wishlistItemId: string
): Promise<WishlistActionResult> {
  const userId = await assertWishlistUser();
  if (!userId) return { ok: false, message: "Sign in to manage your wishlist." };

  const item = await prisma.wishlistItem.findFirst({
    where: { id: wishlistItemId, wishlist: { userId } },
    select: { id: true },
  });
  if (item) {
    await prisma.wishlistItem.delete({ where: { id: item.id } });
  }
  return { ok: true };
}