import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryFilters } from "@/config/categories";
import { SITE_URL } from "@/config/constants";
import { CatalogListingView } from "@/components/catalog/catalog-listing-view";
import { ErrorState } from "@/components/ui/error-state";
import type { MultiFilterKey } from "@/lib/catalog-url";
import {
  buildPricePresets,
  getCatalogListing,
  getCategoryBySlug,
  getFilterGroups,
  getPriceRange,
  parseCatalogParams,
  serializeProductCard,
  type SearchParams,
} from "@/lib/catalog";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  const url = `${SITE_URL}/category/${slug}`;
  const description =
    category.description ??
    `Shop ${category.name} at AYLI — curated styles for the modern Indian woman.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: url },
    openGraph: { title: category.name, description, url, type: "website" },
    twitter: { card: "summary_large_image", title: category.name, description },
  };
}

const PAGE_SIZE = 16;

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const current = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const catalogParams = parseCatalogParams(current);
  const pathname = `/category/${slug}`;
  const scopeWhere = { category: { slug } };
  const multiKeys = getCategoryFilters(slug)
    .filter((f) => f.type === "multi")
    .map((f) => f.key) as MultiFilterKey[];
  const filterKeys: MultiFilterKey[] = Array.from(
    new Set(["size", "colour", ...multiKeys])
  );

  let listing;
  let groups;
  let priceRange;
  try {
    [listing, groups, priceRange] = await Promise.all([
      getCatalogListing(scopeWhere, catalogParams, PAGE_SIZE),
      getFilterGroups(scopeWhere, catalogParams, filterKeys),
      getPriceRange(scopeWhere, catalogParams),
    ]);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="Could not load this category" />
      </div>
    );
  }

  return (
    <CatalogListingView
      pathname={pathname}
      current={current}
      params={catalogParams}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: category.name }]}
      heading={category.name}
      description={category.description}
      subcategoryChips={category.subcategories.map((sub) => ({
        slug: sub.slug,
        name: sub.name,
        productCount: sub.productCount,
      }))}
      chipBasePath={pathname}
      listing={listing}
      groups={groups}
      priceRange={priceRange}
      presets={buildPricePresets(priceRange)}
      sortOptions={[
        { value: "newest", label: "Newest" },
        { value: "popular", label: "Popularity" },
        { value: "price_asc", label: "Price — Low to High" },
        { value: "price_desc", label: "Price — High to Low" },
      ]}
      sortValue={catalogParams.sort}
      products={listing.products.map(serializeProductCard)}
      exploreHref="/"
    />
  );
}