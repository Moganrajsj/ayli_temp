import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/config/constants";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: Array<{ route: string; priority: number }> = [
  { route: "", priority: 1 },
  { route: "/search", priority: 0.5 },
  { route: "/about", priority: 0.4 },
  { route: "/contact", priority: 0.4 },
  { route: "/privacy-policy", priority: 0.3 },
  { route: "/terms", priority: 0.3 },
  { route: "/shipping-policy", priority: 0.3 },
  { route: "/return-refund", priority: 0.3 },
  { route: "/size-guide", priority: 0.4 },
  { route: "/care-guide", priority: 0.4 },
  { route: "/faq", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, subcategories, collections, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.subcategory.findMany({
      where: { isActive: true, category: { isActive: true } },
      select: { slug: true, category: { select: { slug: true } } },
    }),
    prisma.collection.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const routes: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ route, priority }) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority,
  }));

  for (const cat of categories) {
    routes.push({
      url: `${SITE_URL}/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const sub of subcategories) {
    routes.push({
      url: `${SITE_URL}/category/${sub.category.slug}/${sub.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const col of collections) {
    routes.push({
      url: `${SITE_URL}/collection/${col.slug}`,
      lastModified: col.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const product of products) {
    routes.push({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  return routes;
}