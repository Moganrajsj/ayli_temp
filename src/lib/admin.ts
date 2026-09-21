import { prisma } from "@/lib/prisma";

export interface AdminCategoryOption {
  id: string;
  name: string;
  slug: string;
  subcategories: Array<{ id: string; name: string; slug: string }>;
}

export interface AdminCollectionOption {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  productType: string | null;
  categoryId: string;
  subcategoryId: string | null;
  description: string | null;
  shortDescription: string | null;
  mrp: number;
  sellingPrice: number;
  costPrice: number | null;
  taxRate: number;
  fabric: string | null;
  pattern: string | null;
  printType: string | null;
  sleeveType: string | null;
  neckType: string | null;
  length: string | null;
  fit: string | null;
  waist: string | null;
  rise: string | null;
  occasion: string | null;
  material: string | null;
  transparency: string | null;
  stretchability: string | null;
  washCare: string | null;
  sizeChartUrl: string | null;
  modelInfo: string | null;
  garmentMeasurements: string | null;
  productMeasurements: string | null;
  countryOfOrigin: string;
  isActive: boolean;
  isFeatured: boolean;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    isMain: boolean;
    sortOrder: number;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    barcode: string | null;
    colour: string;
    colourHex: string | null;
    size: string;
    price: number | null;
    isActive: boolean;
    stock: number;
  }>;
  collectionIds: string[];
}

export async function getAdminCategoryOptions(): Promise<AdminCategoryOption[]> {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      subcategories: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getAdminCollectionOptions(): Promise<AdminCollectionOption[]> {
  return prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getAdminProductDetail(id: string): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { colour: "asc", size: "asc" }, include: { inventory: true } },
      collections: { select: { collectionId: true } },
    },
  });
  if (!product) return null;

  return {
    ...product,
    mrp: Number(product.mrp),
    sellingPrice: Number(product.sellingPrice),
    costPrice: product.costPrice != null ? Number(product.costPrice) : null,
    taxRate: Number(product.taxRate),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      colour: v.colour,
      colourHex: v.colourHex,
      size: v.size,
      price: v.price != null ? Number(v.price) : null,
      isActive: v.isActive,
      stock: v.inventory?.stockQuantity ?? 0,
    })),
    collectionIds: product.collections.map((c) => c.collectionId),
  };
}