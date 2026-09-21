// Server-only wishlist data. Read helpers for pages/buttons; mutations live in
// actions/wishlist.action.ts.
import { prisma } from "@/lib/prisma";
import {
  productCardSelect,
  serializeProductCard,
  type SerializedProductCard,
} from "@/lib/catalog";

export interface WishlistEntry {
  id: string;
  product: SerializedProductCard;
}

export async function getWishlist(userId: string): Promise<WishlistEntry[]> {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: {
      items: {
        where: { product: { isActive: true } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          product: { select: productCardSelect },
        },
      },
    },
  });
  return (wishlist?.items ?? []).map((item) => ({
    id: item.id,
    product: serializeProductCard(item.product),
  }));
}

export async function isWishlisted(
  userId: string,
  productId: string
): Promise<boolean> {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: {
      items: {
        where: { productId },
        select: { id: true },
        take: 1,
      },
    },
  });
  return (wishlist?.items?.length ?? 0) > 0;
}