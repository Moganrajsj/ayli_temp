// Server-only catalog data layer. Building blocks for category/subcategory/
// collection/search listing pages and the product detail page (PDP).
//
// Filter state is fully URL-driven: every facet value, price range, sort and
// page lives in the query string. The Prisma `where` is built server-side from
// those params, and facet option counts are computed against the *current*
// scope (dependent filters) so no empty/irrelevant group is ever rendered.
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { discountPercent, formatINR } from "@/lib/utils";
import { FILTER_LABELS } from "@/config/categories";
import {
  CONSTANT_KEYS,
  CONSTANT_KEY_SET,
  VARIANT_KEYS,
  splitMulti,
  validPage,
  type MultiFilterKey,
} from "@/lib/catalog-url";

// ─── Sorts ───────────────────────────────────────────────────────────────────

export type SortKey = "newest" | "price_asc" | "price_desc" | "popular";

export interface SortOption {
  value: SortKey;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popularity" },
  { value: "price_asc", label: "Price — Low to High" },
  { value: "price_desc", label: "Price — High to Low" },
];

const SORT_KEYS: readonly string[] = SORT_OPTIONS.map((o) => o.value);

function isSortKey(value: unknown): value is SortKey {
  return typeof value === "string" && SORT_KEYS.includes(value);
}

function orderByFor(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ sellingPrice: "asc" }];
    case "price_desc":
      return [{ sellingPrice: "desc" }];
    case "popular":
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

// ─── Catalog params ─────────────────────────────────────────────────────────

export interface CatalogParams {
  sort: SortKey;
  page: number;
  priceMin?: number;
  priceMax?: number;
  facets: Partial<Record<MultiFilterKey, string[]>>;
}

export type SearchParams = Record<string, string | string[] | undefined>;

function numberParam(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseCatalogParams(searchParams: SearchParams): CatalogParams {
  const facets: CatalogParams["facets"] = {};
  for (const key of CONSTANT_KEYS) {
    const values = splitMulti(searchParams[key]);
    if (values.length) facets[key] = values;
  }
  // size/colour compared case-insensitively — keep raw values for round-trips.
  for (const key of VARIANT_KEYS) {
    const values = splitMulti(searchParams[key]);
    if (values.length) facets[key] = values;
  }

  const sort = isSortKey(searchParams.sort) ? searchParams.sort : "newest";
  const priceMin = numberParam(searchParams.priceMin);
  const priceMax = numberParam(searchParams.priceMax);

  return {
    sort,
    page: validPage(
      typeof searchParams.page === "string" ? searchParams.page : undefined
    ),
    priceMin,
    priceMax,
    facets,
  };
}

function withoutFacet(
  params: CatalogParams,
  key: MultiFilterKey
): CatalogParams {
  const next = { ...params, facets: { ...params.facets } };
  delete next.facets[key];
  return next;
}

// ─── Where builder ──────────────────────────────────────────────────────────

function variantFacetCondition(
  facets: CatalogParams["facets"]
): Prisma.ProductVariantWhereInput | undefined {
  const size = facets.size;
  const colour = facets.colour;
  if (!size?.length && !colour?.length) return undefined;

  return {
    isActive: true,
    ...(size?.length && { size: { in: size } }),
    ...(colour?.length && { colour: { in: colour } }),
  };
}

/**
 * Product where for the given (scope, params). Scope is the page-level `where`
 * (category, subcategory, collection, search) — filters are layered on top.
 */
export function buildProductWhere(
  scopeWhere: Prisma.ProductWhereInput,
  params: CatalogParams
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    ...scopeWhere,
    isActive: true,
  };

  for (const key of CONSTANT_KEYS) {
    const values = params.facets[key];
    if (!values?.length) continue;
    where[key] =
      values.length === 1 ? { contains: values[0] } : { in: values };
  }

  const variantCondition = variantFacetCondition(params.facets);
  if (variantCondition) where.variants = { some: variantCondition };

  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    where.sellingPrice = {};
    if (params.priceMin !== undefined) where.sellingPrice.gte = params.priceMin;
    if (params.priceMax !== undefined) where.sellingPrice.lte = params.priceMax;
  }

  return where;
}

// ─── Listing data ───────────────────────────────────────────────────────────

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  sellingPrice: true,
  mrp: true,
  isFeatured: true,
  images: {
    orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }],
    take: 2,
    select: { url: true, alt: true },
  },
  variants: {
    where: { isActive: true },
    select: { colour: true, colourHex: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

export interface CatalogListing {
  products: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function getCatalogListing(
  scopeWhere: Prisma.ProductWhereInput,
  params: CatalogParams,
  pageSize = 48
): Promise<CatalogListing> {
  const where = buildProductWhere(scopeWhere, params);
  const skip = (params.page - 1) * pageSize;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy: orderByFor(params.sort),
      skip,
      take: pageSize,
    }),
  ]);

  return {
    products,
    total,
    page: params.page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ─── Facets (options + counts, computed against current scope) ──────────────

export interface FilterOption {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  swatch?: string | null;
}

export interface FilterGroup {
  key: MultiFilterKey;
  label: string;
  options: FilterOption[];
}

export interface PriceRange {
  min: number;
  max: number;
  selectedMin: number;
  selectedMax: number;
}

export interface PricePreset {
  label: string;
  min: number | null;
  max: number | null;
}

/**
 * Evenly-split price buckets derived from the live range — never hardcoded.
 * Thirds: "Under ₹u", "₹l – ₹u", "Above ₹u". Single-value ranges collapse
 * to one "All" preset.
 */
export function buildPricePresets(range: PriceRange): PricePreset[] {
  const span = range.max - range.min;
  if (span <= 0) {
    return [{ label: `All · ${formatINR(range.min)}`, min: null, max: null }];
  }

  const step = Math.round(span / 3);
  const lowerMid = range.min + step;
  const upperMid = range.max - step;

  if (lowerMid >= range.max || upperMid <= range.min) {
    return [{ label: `Under ${formatINR(range.max + 1)}`, min: null, max: range.max }];
  }

  return [
    { label: `Under ${formatINR(lowerMid)}`, min: null, max: lowerMid - 1 },
    { label: `${formatINR(lowerMid)} – ${formatINR(upperMid)}`, min: lowerMid, max: upperMid },
    { label: `Above ${formatINR(upperMid)}`, min: upperMid + 1, max: null },
  ];
}

async function constantFacetGroup(
  key: (typeof CONSTANT_KEYS)[number],
  scopeWhere: Prisma.ProductWhereInput,
  params: CatalogParams
): Promise<FilterGroup | null> {
  const where = buildProductWhere(scopeWhere, withoutFacet(params, key));
  const rows = (await prisma.product.groupBy({
    by: [key],
    where,
    _count: { _all: true },
  })) as unknown as Array<{
    [K in (typeof CONSTANT_KEYS)[number]]: string;
  } & { _count: { _all: number } }>;

  const selected = params.facets[key] ?? [];
  const options: FilterOption[] = rows
    .filter((row) => typeof row[key] === "string" && row[key].length > 0)
    .map((row) => ({
      value: row[key],
      label: row[key],
      count: row._count._all,
      selected: selected.some((v) => v.toLowerCase() === row[key].toLowerCase()),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  if (!options.length) return null;
  return { key, label: FILTER_LABELS[key], options };
}

async function variantFacetGroup(
  key: "size" | "colour",
  scopeWhere: Prisma.ProductWhereInput,
  params: CatalogParams
): Promise<FilterGroup | null> {
  const otherParams = withoutFacet(params, key);
  const productWhere = buildProductWhere(scopeWhere, otherParams);
  const variantWhere: Prisma.ProductVariantWhereInput = {
    product: productWhere,
    isActive: true,
    ...(key === "size" &&
      otherParams.facets.colour?.length && {
        colour: { in: otherParams.facets.colour },
      }),
    ...(key === "colour" &&
      otherParams.facets.size?.length && {
        size: { in: otherParams.facets.size },
      }),
  };

  const rows = await prisma.productVariant.findMany({
    where: variantWhere,
    select:
      key === "colour"
        ? { colour: true, colourHex: true }
        : { size: true },
    distinct: ["productId", key],
    orderBy: [{ productId: "asc" }, { [key]: "asc" }],
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const v = (row as unknown as Record<string, string>)[key];
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  const selected = params.facets[key] ?? [];
  const options: FilterOption[] = [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: value,
      count,
      selected: selected.some((v) => v.toLowerCase() === value.toLowerCase()),
      ...(key === "colour" && {
        swatch:
          (
            rows.find(
              (r) =>
                (r as unknown as Record<string, string>).colour === value
            ) as { colourHex?: string | null } | undefined
          )?.colourHex ?? null,
      }),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  if (!options.length) return null;
  return { key, label: FILTER_LABELS[key], options };
}

export async function getFilterGroups(
  scopeWhere: Prisma.ProductWhereInput,
  params: CatalogParams,
  keys: readonly MultiFilterKey[]
): Promise<FilterGroup[]> {
  const groups = await Promise.all(
    keys.map((key) => {
      if (key === "size" || key === "colour") {
        return variantFacetGroup(key, scopeWhere, params);
      }
      if (CONSTANT_KEY_SET.has(key)) {
        return constantFacetGroup(key, scopeWhere, params);
      }
      return Promise.resolve(null);
    })
  );
  return groups.filter((g): g is FilterGroup => g !== null);
}

export async function getPriceRange(
  scopeWhere: Prisma.ProductWhereInput,
  params: CatalogParams
): Promise<PriceRange> {
  const where = buildProductWhere(scopeWhere, {
    ...params,
    priceMin: undefined,
    priceMax: undefined,
  });
  const agg = await prisma.product.aggregate({
    where,
    _min: { sellingPrice: true },
    _max: { sellingPrice: true },
  });

  const min = agg._min.sellingPrice?.toNumber() ?? 0;
  const max = agg._max.sellingPrice?.toNumber() ?? min;

  return {
    min,
    max,
    selectedMin: Math.max(params.priceMin ?? min, min),
    selectedMax: Math.min(params.priceMax ?? max, max),
  };
}

// ─── Navigation targets (categories / subcategories / collections) ──────────

export interface ScopeMeta {
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
}

export interface CategoryMeta extends ScopeMeta {
  subcategories: Array<ScopeMeta & { image: string | null }>;
}

const scopeMetaSelect = {
  slug: true,
  name: true,
  description: true,
  _count: { select: { products: { where: { isActive: true } } } },
} satisfies Prisma.CategorySelect;

const collectionSelect = {
  slug: true,
  name: true,
  description: true,
  _count: {
    select: { products: { where: { product: { isActive: true } } } },
  },
} satisfies Prisma.CollectionSelect;

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryMeta | null> {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: {
      ...scopeMetaSelect,
      subcategories: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          slug: true,
          name: true,
          description: true,
          image: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      },
    },
  });
  if (!category) return null;

  return {
    slug: category.slug,
    name: category.name,
    description: category.description,
    productCount: category._count.products,
    subcategories: category.subcategories.map((sub) => ({
      slug: sub.slug,
      name: sub.name,
      description: sub.description,
      image: sub.image,
      productCount: sub._count.products,
    })),
  };
}

export async function getSubcategoryBySlug(
  categorySlug: string,
  subcategorySlug: string
): Promise<(ScopeMeta & { category: ScopeMeta }) | null> {
  const sub = await prisma.subcategory.findFirst({
    where: {
      slug: subcategorySlug,
      isActive: true,
      category: { slug: categorySlug, isActive: true },
    },
    select: {
      slug: true,
      name: true,
      description: true,
      _count: { select: { products: { where: { isActive: true } } } },
      category: {
        select: {
          slug: true,
          name: true,
          description: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      },
    },
  });
  if (!sub) return null;

  return {
    slug: sub.slug,
    name: sub.name,
    description: sub.description,
    productCount: sub._count.products,
    category: {
      slug: sub.category.slug,
      name: sub.category.name,
      description: sub.category.description,
      productCount: sub.category._count.products,
    },
  };
}

export async function getCollectionBySlug(
  slug: string
): Promise<ScopeMeta | null> {
  const collection = await prisma.collection.findFirst({
    where: { slug, isActive: true },
    select: collectionSelect,
  });
  if (!collection) return null;
  return {
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    productCount: collection._count.products,
  };
}

// ─── Product detail (PDP) ───────────────────────────────────────────────────

const SIZE_RANK = new Map([
  ["XS", 1],
  ["S", 2],
  ["M", 3],
  ["L", 4],
  ["XL", 5],
  ["XXL", 6],
  ["XXXL", 7],
]);

function sizeRank(size: string): number {
  const explicit = SIZE_RANK.get(size);
  if (explicit) return explicit;
  const numeric = Number.parseInt(size, 10);
  return Number.isFinite(numeric) ? 100 + numeric : 200;
}

export interface VariantAvailability {
  stockQuantity: number;
  reservedQuantity: number;
  available: boolean;
  lowStock: boolean;
}

export interface PdpVariant {
  id: string;
  sku: string;
  colour: string;
  colourHex: string | null;
  size: string;
  price: number | null;
  availability: VariantAvailability;
}

export interface PdpData {
  product: Prisma.ProductGetPayload<{
    include: typeof pdpInclude;
  }>;
  variants: PdpVariant[];
  colours: Array<{ colour: string; colourHex: string | null }>;
  discountPercent: number;
}

const pdpInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: {
    where: { isActive: true },
    include: { inventory: true },
  },
  category: { select: { id: true, slug: true, name: true } },
  subcategory: { select: { id: true, slug: true, name: true } },
  collections: {
    include: { collection: { select: { slug: true, name: true } } },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.ProductInclude;

export async function getProductBySlug(slug: string): Promise<PdpData | null> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: pdpInclude,
  });
  if (!product) return null;

  const variants: PdpVariant[] = product.variants
    .map((variant) => {
      const stockQuantity = variant.inventory?.stockQuantity ?? 0;
      const reservedQuantity = variant.inventory?.reservedQuantity ?? 0;
      const availableQty = stockQuantity - reservedQuantity;
      const lowStock = (variant.inventory?.lowStockThreshold ?? 5) > 0;
      return {
        id: variant.id,
        sku: variant.sku,
        colour: variant.colour,
        colourHex: variant.colourHex,
        size: variant.size,
        price: variant.price?.toNumber() ?? null,
        availability: {
          stockQuantity,
          reservedQuantity,
          available: availableQty > 0,
          lowStock,
        },
      };
    })
    .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));

  const colours = Array.from(
    new Map(
      product.variants.map((v) => [v.colour.toLowerCase(), {
        colour: v.colour,
        colourHex: v.colourHex,
      }])
    ).values()
  );

  const mrp = product.mrp.toNumber();
  const selling = product.sellingPrice.toNumber();
  const discountPercent =
    mrp > selling && mrp > 0
      ? Math.round(((mrp - selling) / mrp) * 100)
      : 0;

  return { product, variants, colours, discountPercent };
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 8
): Promise<ProductCardData[]> {
  const scopeWhere: Prisma.ProductWhereInput = {
    categoryId,
    id: { not: productId },
  };
  const listing = await getCatalogListing(
    scopeWhere,
    { sort: "newest", page: 1, facets: {} },
    limit
  );
  return listing.products;
}

// ─── Client-safe serialization (shared by pages + search API + components) ───

export interface SerializedProductCard {
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  mrp: number;
  discountPercent: number;
  image: string | null;
  imageHover: string | null;
  imageAlt: string;
  colours: number;
}

export function serializeProductCard(
  card: ProductCardData
): SerializedProductCard {
  const mrp = card.mrp.toNumber();
  const price = card.sellingPrice.toNumber();
  return {
    slug: card.slug,
    name: card.name,
    shortDescription: card.shortDescription,
    price,
    mrp,
    discountPercent: discountPercent(mrp, price),
    image: card.images[0]?.url ?? null,
    imageHover: card.images[1]?.url ?? null,
    imageAlt: card.images[0]?.alt ?? `AYLI ${card.name}`,
    colours: card.variants.length,
  };
}