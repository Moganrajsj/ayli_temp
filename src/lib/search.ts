// Server-only search layer. ILIKE-based text + colour search (the schema has
// no tsvector column — see plan §8 vs. current schema) with JS relevance
// ranking, plus suggestions + pre-typing trending data.
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getCatalogListing,
  productCardSelect,
  type CatalogListing,
  type CatalogParams,
  type ProductCardData,
} from "@/lib/catalog";

// ─── Where builder ──────────────────────────────────────────────────────────

const SEARCH_FIELDS = [
  "name",
  "productType",
  "fabric",
  "pattern",
  "occasion",
  "material",
  "shortDescription",
  "description",
] as const;

export function buildSearchWhere(query: string): Prisma.ProductWhereInput {
  const term = query.trim();
  if (!term) return { isActive: true };

  const textOr: Prisma.ProductWhereInput[] = SEARCH_FIELDS.map(
    (field) =>
      ({
        [field]: { contains: term },
      }) as unknown as Prisma.ProductWhereInput
  );

  return {
    isActive: true,
    OR: [
      ...textOr,
      {
        variants: {
          some: {
            isActive: true,
            colour: { contains: term },
          },
        },
      },
    ],
  };
}

// ─── Relevance ranking (JS) ─────────────────────────────────────────────────

function relevanceScore(card: ProductCardData, term: string): number {
  const t = term.toLowerCase();
  const name = card.name.toLowerCase();
  const colours = card.variants.map((v) => v.colour.toLowerCase());

  let score = 0;
  if (name.startsWith(t)) score += 120;
  else if (name.includes(t)) score += 90;

  if (colours.includes(t)) score += 70;
  else if (colours.some((c) => c.includes(t))) score += 40;

  if (card.shortDescription?.toLowerCase().includes(t)) score += 5;
  return score;
}

// ─── Search results (with pagination + ranking) ─────────────────────────────

export type SearchSortKey = CatalogParams["sort"] | "relevance";

export interface SearchParams extends Omit<CatalogParams, "sort"> {
  query: string;
  sort: SearchSortKey;
}

export async function searchCatalog(
  searchParams: SearchParams,
  pageSize = 48
): Promise<CatalogListing> {
  const where = buildSearchWhere(searchParams.query);

  if (searchParams.sort === "relevance") {
    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, select: productCardSelect }),
    ]);

    const ranked = rows
      .map((card) => ({ card, score: relevanceScore(card, searchParams.query) }))
      .sort(
        (a, b) =>
          b.score - a.score || a.card.name.localeCompare(b.card.name)
      );

    const start = (searchParams.page - 1) * pageSize;
    const products = ranked
      .slice(start, start + pageSize)
      .map((entry) => entry.card);

    return {
      products,
      total,
      page: searchParams.page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  const catalogParams: CatalogParams = {
    sort: searchParams.sort,
    page: searchParams.page,
    priceMin: searchParams.priceMin,
    priceMax: searchParams.priceMax,
    facets: searchParams.facets,
  };
  return getCatalogListing(where, catalogParams, pageSize);
}

// ─── Suggestions + trending (pre-typing state) ──────────────────────────────

export interface SuggestionCategory {
  slug: string;
  name: string;
}

export interface SearchSuggestions {
  products: ProductCardData[];
  categories: SuggestionCategory[];
  collections: SuggestionCategory[];
}

const CATEGORY_LIKE = (term: string): Prisma.CategoryWhereInput => ({
  isActive: true,
  OR: [
    { name: { contains: term } },
    { slug: { contains: term.toLowerCase() } },
  ],
});

export async function getSearchSuggestions(
  query: string,
  productLimit = 5,
  categoryLimit = 4
): Promise<SearchSuggestions> {
  const term = query.trim();
  if (!term) {
    return { products: [], categories: [], collections: [] };
  }

  const productWhere = buildSearchWhere(term);
  const [products, categories, collections] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      select: productCardSelect,
      take: productLimit,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({
      where: CATEGORY_LIKE(term),
      take: categoryLimit,
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.collection.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term } },
          { slug: { contains: term.toLowerCase() } },
        ],
      },
      take: categoryLimit,
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  return {
    products,
    categories,
    collections,
  };
}

export async function getTrendingSearch(): Promise<SearchSuggestions> {
  const [products, categories, collections] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: productCardSelect,
      take: 5,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, name: true },
    }),
    prisma.collection.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, name: true },
    }),
  ]);

  const firstCategories = categories.slice(0, 6);
  return { products, categories: firstCategories, collections };
}