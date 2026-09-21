// Server-only cart data layer. Resolves CartItem / raw guest rows into listable
// lines with live stock, MRP vs selling price, and totals. Prices are inclusive
// of all taxes (see PDP copy), so the only extra is shipping.
import { prisma } from "@/lib/prisma";

export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 99;
export const MAX_LINE_QTY = 5;

export interface CartLineInput {
  variantId: string;
  quantity: number;
  id?: string | null;
}

export interface CartLine {
  id: string | null;
  variantId: string;
  quantity: number;
  productId: string;
  productSlug: string;
  name: string;
  image: string | null;
  colour: string;
  colourHex: string | null;
  size: string;
  unitSelling: number;
  unitMrp: number;
  lineSelling: number;
  lineMrp: number;
  discountPercent: number;
  available: number;
  maxQty: number;
  availableNow: boolean;
}

export interface CartTotals {
  itemCount: number;
  mrpTotal: number;
  sellingTotal: number;
  savings: number;
  shipping: number;
  grandTotal: number;
  shippingNote: string;
  shippingFree: boolean;
}

export interface SerializedCart {
  lines: CartLine[];
  totals: CartTotals;
}

function cartTotals(lines: CartLine[]): CartTotals {
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const sellingTotal = lines.reduce((sum, l) => sum + l.lineSelling, 0);
  const mrpTotal = lines.reduce((sum, l) => sum + l.lineMrp, 0);
  const shippingFree = sellingTotal >= FREE_SHIPPING_THRESHOLD || lines.length === 0;
  const shipping = shippingFree ? 0 : STANDARD_SHIPPING_FEE;
  return {
    itemCount,
    mrpTotal,
    sellingTotal,
    savings: Math.max(0, mrpTotal - sellingTotal),
    shipping,
    shippingFree,
    shippingNote: lines.length === 0
      ? ""
      : shippingFree
        ? "Free standard shipping unlocked"
        : `Add ${new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(FREE_SHIPPING_THRESHOLD - sellingTotal)} more for free shipping`,
    grandTotal: sellingTotal + shipping,
  };
}

function unitPrice(variant: { price: { toNumber(): number } | null }, product: { sellingPrice: { toNumber(): number } }): number {
  const vp = variant.price?.toNumber();
  return vp != null && vp > 0 ? vp : product.sellingPrice.toNumber();
}

// Resolve arbitrary rows (CartItem rows or guest payload items) into lines.
export async function resolveCartLines(
  inputs: CartLineInput[]
): Promise<CartLine[]> {
  if (inputs.length === 0) return [];
  const uniqueIds = [...new Set(inputs.map((i) => i.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      colour: true,
      colourHex: true,
      size: true,
      price: true,
      isActive: true,
      inventory: {
        select: { stockQuantity: true, reservedQuantity: true },
      },
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          isActive: true,
          mrp: true,
          sellingPrice: true,
          images: {
            where: { isMain: true },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines: CartLine[] = [];
  const seen = new Set<string>();

  for (const input of inputs) {
    const variant = byId.get(input.variantId);
    if (!variant) continue;
    if (seen.has(input.variantId)) continue;
    seen.add(input.variantId);

    const available = Math.max(
      0,
      (variant.inventory?.stockQuantity ?? 0) - (variant.inventory?.reservedQuantity ?? 0)
    );
    const active = Boolean(variant.isActive && variant.product.isActive);
    const selling = unitPrice(variant, variant.product);
    const mrp = variant.product.mrp.toNumber();
    const quantity = Math.max(
      1,
      Math.min(MAX_LINE_QTY, Math.floor(input.quantity || 0))
    );
    const maxQty = !active || available <= 0 ? 0 : Math.min(MAX_LINE_QTY, available);

    lines.push({
      id: input.id ?? null,
      variantId: variant.id,
      quantity: active && available > 0 ? Math.min(quantity, maxQty || quantity) : quantity,
      productId: variant.product.id,
      productSlug: variant.product.slug,
      name: variant.product.name,
      image: variant.product.images[0]?.url ?? null,
      colour: variant.colour,
      colourHex: variant.colourHex,
      size: variant.size,
      unitSelling: selling,
      unitMrp: mrp,
      lineSelling: selling * quantity,
      lineMrp: mrp * quantity,
      discountPercent:
        mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0,
      available,
      maxQty,
      availableNow: active && available > 0,
    });
  }

  return lines;
}

export async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getServerCart(userId: string): Promise<SerializedCart> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });
  const inputs: CartLineInput[] = (cart?.items ?? []).map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    id: item.id,
  }));
  const lines = await resolveCartLines(inputs);
  const sorted = lines.sort((a, b) => a.id!.localeCompare(b.id ?? ""));
  return { lines: sorted, totals: cartTotals(sorted) };
}

export async function getServerCartCount(userId: string): Promise<number> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        select: {
          quantity: true,
          variant: {
            select: {
              isActive: true,
              inventory: {
                select: { stockQuantity: true, reservedQuantity: true },
              },
            },
          },
        },
      },
    },
  });
  return (cart?.items ?? []).reduce((sum, item) => {
    const available =
      (item.variant.inventory?.stockQuantity ?? 0) -
      (item.variant.inventory?.reservedQuantity ?? 0);
    return sum + (item.variant.isActive && available > 0 ? item.quantity : 0);
  }, 0);
}

export async function serializePreview(
  inputs: CartLineInput[]
): Promise<SerializedCart> {
  const lines = await resolveCartLines(inputs);
  return { lines, totals: cartTotals(lines) };
}