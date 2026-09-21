import type { Metadata } from "next";
import { getAdminHomepageData } from "@/lib/homepage-config";
import { HomepageManager } from "@/components/admin/homepage-manager";

export const metadata: Metadata = {
  title: "Homepage Customization",
  description: "Customize which products and categories display on the storefront homepage.",
};

export default async function AdminHomepagePage() {
  const { categories, config } = await getAdminHomepageData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Homepage Showcase Customization
        </h1>
        <p className="mt-1 text-sm text-muted">
          Choose which categories appear as product strips on the storefront, reorder sections, and select exactly which products to highlight.
        </p>
      </div>

      <HomepageManager
        initialCategories={categories}
        initialSections={config.sections}
      />
    </div>
  );
}
