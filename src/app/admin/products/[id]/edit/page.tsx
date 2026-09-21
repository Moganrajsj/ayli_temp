import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProductDetail, getAdminCategoryOptions, getAdminCollectionOptions } from "@/lib/admin";
import { ProductForm } from "@/components/admin/product-form";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Edit product",
  description: "Edit a product.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([
    getAdminProductDetail(id),
    getAdminCategoryOptions(),
    getAdminCollectionOptions(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Products
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Edit: {product.name}
      </h1>
      <p className="mt-1 truncate text-sm text-muted">{product.sku}</p>
      <div className="mt-6">
        <ProductForm
          mode="edit"
          productId={product.id}
          initial={product}
          categories={categories}
          collections={collections}
        />
      </div>
    </div>
  );
}