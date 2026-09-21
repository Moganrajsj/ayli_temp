import type { Metadata } from "next";
import { getAdminCategoryOptions, getAdminCollectionOptions } from "@/lib/admin";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "New product",
  description: "Create a product.",
};

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    getAdminCategoryOptions(),
    getAdminCollectionOptions(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">New product</h1>
      <p className="mt-1 text-sm text-muted">
        Basics, pricing, attributes, images, variants and collections.
      </p>
      <div className="mt-6">
        <ProductForm mode="create" initial={null} categories={categories} collections={collections} />
      </div>
    </div>
  );
}