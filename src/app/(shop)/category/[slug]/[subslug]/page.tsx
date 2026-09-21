import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryFilters } from "@/config/categories";
import { CatalogListingView } from "@/components/catalog/catalog-listing-view";
import { ErrorState } from "@/components/ui/error-state";
import type { MultiFilterKey } from "@/lib/catalog-url";
import {
  buildPricePresets,
  getCatalogListing,
  getFilterGroups,
  getPriceRange,
  getSubcategoryBySlug,
  parseCatalogParams,
  serializeProductCard,
  type SearchParams,
} from "@/lib/catalog";

interface SubcategoryPageProps {
  params: Promise<{ slug: string; subslug: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({
  params,
}: SubcategoryPageProps): Promise<Metadata> {
  const { slug, subslug } = await params;
  const subcategory = await getSubcategoryBySlug(slug, subslug);
  return {
    title: subcategory ? subcategory.name : "Subcategory",
    description: subcategory?.description ?? undefined,
  };
}

const PAGE_SIZE = 16;

export default async function SubcategoryPage({
  params,
  searchParams,
}: SubcategoryPageProps) {
  const { slug, subslug } = await params;
  const current = await searchParams;

  const subcategory = await getSubcategoryBySlug(slug, subslug);
  if (!subcategory) notFound();

  const catalogParams = parseCatalogParams(current);
  const pathname = `/category/${slug}/${subslug}`;
  const scopeWhere = { category: { slug }, subcategory: { slug: subslug } };

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
        <ErrorState title="Could not load this subcategory" />
      </div>
    );
  }

  return (
    <CatalogListingView
      pathname={pathname}
      current={current}
      params={catalogParams}
      breadcrumbs={[
        { label: "Home", href: "/" },
        {
          label: subcategory.category.name,
          href: `/category/${slug}`,
        },
        { label: subcategory.name },
      ]}
      heading={subcategory.name}
      description={subcategory.description}
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
      exploreHref={`/category/${slug}`}
    />
  );
}