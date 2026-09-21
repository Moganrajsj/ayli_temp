"use server";

import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  adminCategorySchema,
  adminCollectionSchema,
  adminProductSchema,
  adminSubcategorySchema,
  formatFieldErrors,
  type AdminProductInput,
  type AdminActionResult,
} from "@/lib/validation";

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth();
  if (session?.user?.id && session.user.role === "ADMIN") {
    return { id: session.user.id };
  }
  return null;
}

function notAuthorized(): AdminActionResult {
  return { ok: false, message: "You are not authorized to perform this action." };
}

/* ───────── Product CRUD ───────── */

const OPTIONAL_TEXT = [
  "brand",
  "productType",
  "subcategoryId",
  "description",
  "shortDescription",
  "costPrice",
  "fabric",
  "pattern",
  "printType",
  "sleeveType",
  "neckType",
  "length",
  "fit",
  "waist",
  "rise",
  "occasion",
  "material",
  "transparency",
  "stretchability",
  "washCare",
  "sizeChartUrl",
  "modelInfo",
  "garmentMeasurements",
  "productMeasurements",
] as const;

async function assertUniqueSlugSku(
  slug: string,
  sku: string,
  excludeId?: string,
): Promise<string | null> {
  const where = excludeId ? { id: { not: excludeId } } : undefined;
  const [slugHit, skuHit] = await Promise.all([
    prisma.product.findFirst({ where: { ...where, slug }, select: { id: true } }),
    prisma.product.findFirst({ where: { ...where, sku }, select: { id: true } }),
  ]);
  if (slugHit) return "A product with this slug already exists.";
  if (skuHit) return "A product with this SKU already exists.";
  return null;
}

function buildProductData(input: AdminProductInput) {
  const data: Prisma.ProductUncheckedCreateInput = {
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    categoryId: input.categoryId,
    mrp: input.mrp,
    sellingPrice: input.sellingPrice,
    taxRate: input.taxRate ?? 0,
    isActive: input.isActive ?? true,
    isFeatured: input.isFeatured ?? false,
    countryOfOrigin: input.countryOfOrigin ?? "India",
  };
  for (const key of OPTIONAL_TEXT) {
    const value = (input as unknown as Record<string, unknown>)[key];
    (data as Record<string, unknown>)[key] =
      value === "" || value === undefined ? null : value;
  }
  return data;
}

export async function createProductAction(input: AdminProductInput): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const parsed = adminProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors: formatFieldErrors(parsed.error.issues) };
  }

  if (parsed.data.sellingPrice > parsed.data.mrp) {
    return { ok: false, fieldErrors: { sellingPrice: "Selling price cannot exceed MRP." } };
  }

  const uniqueError = await assertUniqueSlugSku(parsed.data.slug, parsed.data.sku);
  if (uniqueError) return { ok: false, fieldErrors: { [uniqueError.includes("slug") ? "slug" : "sku"]: uniqueError } };

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...buildProductData(parsed.data),
          images: {
            create: parsed.data.images.map((img, i) => ({
              url: img.url,
              alt: img.alt || null,
              isMain: img.isMain || i === 0,
              sortOrder: img.sortOrder ?? i,
            })),
          },
          variants: {
            create: parsed.data.variants.map((v) => ({
              sku: v.sku,
              barcode: v.barcode || null,
              colour: v.colour,
              colourHex: v.colourHex || null,
              size: v.size,
              price: v.price ?? null,
              isActive: v.active ?? true,
              inventory: {
                create: { stockQuantity: v.stock ?? 0 },
              },
            })),
          },
          collections: {
            create: parsed.data.collectionIds.map((collectionId) => ({ collectionId })),
          },
        },
        select: { id: true },
      });
      return created;
    });
    return { ok: true, id: product.id, message: "Product created." };
  } catch {
    return { ok: false, message: "Could not save product. Check for duplicate variant SKUs." };
  }
}

export async function updateProductAction(
  id: string,
  input: AdminProductInput,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const parsed = adminProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors: formatFieldErrors(parsed.error.issues) };
  }
  if (parsed.data.sellingPrice > parsed.data.mrp) {
    return { ok: false, fieldErrors: { sellingPrice: "Selling price cannot exceed MRP." } };
  }

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, message: "Product not found." };

  const uniqueError = await assertUniqueSlugSku(parsed.data.slug, parsed.data.sku, id);
  if (uniqueError) return { ok: false, fieldErrors: { [uniqueError.includes("slug") ? "slug" : "sku"]: uniqueError } };

  try {
    await prisma.$transaction(async (tx) => {
      // Replace images + collection links wholesale (both cascade cleanly).
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productCollection.deleteMany({ where: { productId: id } });

      // Soft-delete variants that are no longer in the payload. Keep the row
      // (order items snapshot against variant IDs, so hard deletes could break FK).
      const keptSkus = new Set(parsed.data.variants.map((v) => v.sku));
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true, sku: true, isActive: true },
      });
      await tx.productVariant.updateMany({
        where: { productId: id, sku: { notIn: [...keptSkus] } },
        data: { isActive: false },
      });

      await tx.product.update({
        where: { id },
        data: {
          ...buildProductData(parsed.data),
          images: {
            create: parsed.data.images.map((img, i) => ({
              url: img.url,
              alt: img.alt || null,
              isMain: img.isMain || i === 0,
              sortOrder: img.sortOrder ?? i,
            })),
          },
          collections: {
            create: parsed.data.collectionIds.map((collectionId) => ({ collectionId })),
          },
        },
      });

      for (const v of parsed.data.variants) {
        const existingVariant = existingVariants.find((ev) => ev.sku === v.sku);
        if (existingVariant) {
          await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              barcode: v.barcode || null,
              colour: v.colour,
              colourHex: v.colourHex || null,
              size: v.size,
              price: v.price ?? null,
              isActive: v.active ?? true,
            },
          });
          const inv = await tx.inventory.findUnique({ where: { variantId: existingVariant.id } });
          if (inv) {
            await tx.inventory.update({ where: { variantId: existingVariant.id }, data: { stockQuantity: v.stock ?? 0 } });
          } else {
            await tx.inventory.create({ data: { variantId: existingVariant.id, stockQuantity: v.stock ?? 0 } });
          }
        } else {
          await tx.productVariant.create({
            data: {
              sku: v.sku,
              barcode: v.barcode || null,
              colour: v.colour,
              colourHex: v.colourHex || null,
              size: v.size,
              price: v.price ?? null,
              isActive: v.active ?? true,
              productId: id,
              inventory: { create: { stockQuantity: v.stock ?? 0 } },
            },
          });
        }
      }
    });
    return { ok: true, message: "Product saved." };
  } catch {
    return {
      ok: false,
      message: "Could not save product. Check for duplicate variant SKUs.",
    };
  }
}

export async function deleteProductAction(id: string): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const hasOrderItems = await prisma.orderItem.findFirst({ where: { productId: id }, select: { id: true } });
  if (hasOrderItems) {
    // Keep the record for order history; just remove it from the storefront.
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { ok: true, message: "Product hidden from storefront (has order history)." };
  }

  await prisma.product.delete({ where: { id } });
  return { ok: true, message: "Product deleted." };
}

export async function setProductActiveAction(id: string, isActive: boolean): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();
  await prisma.product.update({ where: { id }, data: { isActive } });
  return { ok: true, message: isActive ? "Product activated." : "Product deactivated." };
}

/* ───────── Inventory ───────── */

export async function updateVariantStockAction(
  variantId: string,
  stock: number,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();
  if (!Number.isFinite(stock) || stock < 0 || stock > 99999) {
    return { ok: false, message: "Stock must be a number between 0 and 99999." };
  }

  const inv = await prisma.inventory.findUnique({ where: { variantId } });
  if (inv) {
    await prisma.inventory.update({ where: { variantId }, data: { stockQuantity: Math.floor(stock) } });
  } else {
    await prisma.inventory.create({ data: { variantId, stockQuantity: Math.floor(stock) } });
  }
  return { ok: true, message: "Stock updated." };
}

export async function updateInventoryThresholdAction(
  variantId: string,
  threshold: number,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();
  const inv = await prisma.inventory.findUnique({ where: { variantId } });
  if (inv) {
    await prisma.inventory.update({ where: { variantId }, data: { lowStockThreshold: Math.floor(threshold) } });
    return { ok: true, message: "Threshold updated." };
  }
  return { ok: false, message: "Inventory not found." };
}

/* ───────── Categories & subcategories ───────── */

export async function createCategoryAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const parsed = adminCategorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: formData.get("image"),
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, fieldErrors: formatFieldErrors(parsed.error.issues) };

  const exists = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return { ok: false, fieldErrors: { slug: "This slug is already in use." } };

  const created = await prisma.category.create({ data: parsed.data, select: { id: true } });
  return { ok: true, id: created.id, message: "Category created." };
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const parsed = adminCategorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: formData.get("image"),
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, fieldErrors: formatFieldErrors(parsed.error.issues) };

  const dup = await prisma.category.findFirst({ where: { slug: parsed.data.slug, id: { not: id } } });
  if (dup) return { ok: false, fieldErrors: { slug: "This slug is already in use." } };

  await prisma.category.update({ where: { id }, data: parsed.data });
  return { ok: true, message: "Category saved." };
}

export async function createSubcategoryAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const parsed = adminSubcategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, fieldErrors: formatFieldErrors(parsed.error.issues) };

  const dup = await prisma.subcategory.findUnique({
    where: { categoryId_slug: { categoryId: parsed.data.categoryId, slug: parsed.data.slug } },
  });
  if (dup) return { ok: false, fieldErrors: { slug: "This slug already exists in the category." } };

  const created = await prisma.subcategory.create({ data: parsed.data, select: { id: true } });
  return { ok: true, id: created.id, message: "Subcategory created." };
}

export async function updateSubcategoryAction(
  id: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const parsed = adminSubcategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, fieldErrors: formatFieldErrors(parsed.error.issues) };

  await prisma.subcategory.update({ where: { id }, data: parsed.data });
  return { ok: true, message: "Subcategory saved." };
}

export async function deleteSubcategoryAction(id: string): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();
  try {
    await prisma.subcategory.delete({ where: { id } });
    return { ok: true, message: "Subcategory deleted." };
  } catch {
    return { ok: false, message: "Move products out of this subcategory before deleting it." };
  }
}

/* ───────── Collections ───────── */

export async function createCollectionAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const parsed = adminCollectionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: formData.get("image"),
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, fieldErrors: formatFieldErrors(parsed.error.issues) };

  const dup = await prisma.collection.findUnique({ where: { slug: parsed.data.slug } });
  if (dup) return { ok: false, fieldErrors: { slug: "This slug is already in use." } };

  const created = await prisma.collection.create({ data: parsed.data, select: { id: true } });
  return { ok: true, id: created.id, message: "Collection created." };
}

export async function updateCollectionAction(id: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  const parsed = adminCollectionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: formData.get("image"),
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, fieldErrors: formatFieldErrors(parsed.error.issues) };

  const dup = await prisma.collection.findFirst({ where: { slug: parsed.data.slug, id: { not: id } } });
  if (dup) return { ok: false, fieldErrors: { slug: "This slug is already in use." } };

  await prisma.collection.update({ where: { id }, data: parsed.data });
  return { ok: true, message: "Collection saved." };
}

/* ───────── Orders ───────── */

const VALID_STATUS = new Set([
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
]);

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();

  if (!VALID_STATUS.has(status)) return { ok: false, message: "Invalid status." };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as OrderStatus,
      ...(status === "SHIPPED" ? { shippedAt: new Date() } : {}),
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });
  return { ok: true, message: "Order status updated." };
}

export async function updateOrderTrackingAction(
  orderId: string,
  trackingNumber: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();
  await prisma.order.update({
    where: { id: orderId },
    data: { trackingNumber: trackingNumber.trim() || null },
  });
  return { ok: true, message: "Tracking number saved." };
}

export async function updateOrderNotesAction(
  orderId: string,
  notes: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return notAuthorized();
  await prisma.order.update({
    where: { id: orderId },
    data: { notes: notes.trim() || null },
  });
  return { ok: true, message: "Notes saved." };
}