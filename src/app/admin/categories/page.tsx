import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoryManager, type AdminCategoryRow } from "@/components/admin/category-manager";

export const metadata: Metadata = {
  title: "Categories",
  description: "Manage categories, subcategories and the filters they drive.",
};

export default async function AdminCategoriesPage() {
  const categories: AdminCategoryRow[] = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      isActive: true,
      subcategories: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true, description: true, sortOrder: true, isActive: true },
      },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Categories</h1>
      <p className="mt-1 text-sm text-muted">
        Each category&apos;s structure drives which filters appear on its listing pages.
      </p>
      <div className="mt-6">
        <CategoryManager initial={categories} />
      </div>
    </div>
  );
}