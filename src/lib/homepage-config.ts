import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  productCardSelect,
  serializeProductCard,
  type ProductCardData,
  type SerializedProductCard,
} from "@/lib/catalog";

export interface HomepageCategorySectionConfig {
  categoryId: string;
  categorySlug: string;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  enabled: boolean;
  sortOrder: number;
  productIds: string[];
  maxProducts?: number;
}

export interface HomepageConfig {
  sections: HomepageCategorySectionConfig[];
}

const CONFIG_PATH = path.join(
  process.cwd(),
  "src",
  "config",
  "homepage-sections.json"
);

export async function getHomepageConfig(): Promise<HomepageConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const data = JSON.parse(raw) as HomepageConfig;
    if (data && Array.isArray(data.sections)) {
      return data;
    }
  } catch {
    // If file does not exist or parse error, build default fallback from database
  }

  // Generate fallback from DB categories
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { isActive: true },
          take: 6,
          select: { id: true },
        },
      },
    });

    const defaultSections: HomepageCategorySectionConfig[] = categories.map(
      (c, index) => ({
        categoryId: c.id,
        categorySlug: c.slug,
        title: c.name,
        eyebrow: "Studio Collection",
        subtitle: c.description ?? "",
        enabled: index < 4, // Enable first 4 by default
        sortOrder: index,
        productIds: c.products.map((p) => p.id),
        maxProducts: 6,
      })
    );

    const config: HomepageConfig = { sections: defaultSections };
    await saveHomepageConfig(config).catch(() => {});
    return config;
  } catch {
    return { sections: [] };
  }
}

export async function saveHomepageConfig(config: HomepageConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export interface HomepageCategorySectionView {
  section: HomepageCategorySectionConfig;
  products: SerializedProductCard[];
}

export async function getHomepageCategorySections(): Promise<
  HomepageCategorySectionView[]
> {
  const config = await getHomepageConfig();
  const enabledSections = config.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (enabledSections.length === 0) {
    return [];
  }

  const results = await Promise.all(
    enabledSections.map(async (sec) => {
      try {
        let rawProducts: ProductCardData[] = [];

        if (sec.productIds && sec.productIds.length > 0) {
          // Fetch the chosen products
          const hits = await prisma.product.findMany({
            where: {
              id: { in: sec.productIds },
              isActive: true,
            },
            select: productCardSelect,
          });

          // Preserve selected order
          const idMap = new Map(hits.map((p) => [p.id, p]));
          for (const id of sec.productIds) {
            const hit = idMap.get(id);
            if (hit) rawProducts.push(hit);
          }

          // If fewer than 4 found, backfill with remaining category products
          if (rawProducts.length < 4) {
            const remaining = await prisma.product.findMany({
              where: {
                categoryId: sec.categoryId,
                isActive: true,
                id: { notIn: rawProducts.map((p) => p.id) },
              },
              select: productCardSelect,
              orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
              take: 4 - rawProducts.length,
            });
            rawProducts = rawProducts.concat(remaining);
          }
        } else {
          // No customized products specified, pull latest featured in category
          rawProducts = await prisma.product.findMany({
            where: {
              categoryId: sec.categoryId,
              isActive: true,
            },
            select: productCardSelect,
            orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
            take: sec.maxProducts ?? 6,
          });
        }

        const serialized = rawProducts.map(serializeProductCard);
        return {
          section: sec,
          products: serialized,
        };
      } catch (err) {
        console.error(`Failed to load products for category ${sec.title}:`, err);
        return {
          section: sec,
          products: [],
        };
      }
    })
  );

  return results.filter((r) => r.products.length > 0);
}

export interface AdminCategoryWithProducts {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    sku: string;
    sellingPrice: number;
    mrp: number;
    isFeatured: boolean;
    isActive: boolean;
    image: string | null;
  }>;
}

export async function getAdminHomepageData() {
  const [config, dbCategories] = await Promise.all([
    getHomepageConfig(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            sellingPrice: true,
            mrp: true,
            isFeatured: true,
            isActive: true,
            images: {
              where: { isMain: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    }),
  ]);

  const categories: AdminCategoryWithProducts[] = dbCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    sortOrder: cat.sortOrder,
    isActive: cat.isActive,
    products: cat.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      sellingPrice: Number(p.sellingPrice),
      mrp: Number(p.mrp),
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      image: p.images[0]?.url ?? null,
    })),
  }));

  // Ensure all categories have a section config entry
  const existingCategoryIds = new Set(config.sections.map((s) => s.categoryId));
  const mergedSections = [...config.sections];

  for (const cat of categories) {
    if (!existingCategoryIds.has(cat.id)) {
      mergedSections.push({
        categoryId: cat.id,
        categorySlug: cat.slug,
        title: cat.name,
        eyebrow: "Studio Collection",
        subtitle: cat.description ?? "",
        enabled: false,
        sortOrder: mergedSections.length,
        productIds: cat.products.slice(0, 6).map((p) => p.id),
        maxProducts: 6,
      });
    }
  }

  return {
    config: { sections: mergedSections },
    categories,
  };
}
