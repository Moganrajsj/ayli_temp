import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/config/constants";
import { CatalogListingView } from "@/components/catalog/catalog-listing-view";
import { ErrorState } from "@/components/ui/error-state";
import type { MultiFilterKey } from "@/lib/catalog-url";
import { MULTI_KEYS } from "@/lib/catalog-url";
import {
  buildPricePresets,
  getCatalogListing,
  getCollectionBySlug,
  getFilterGroups,
  getPriceRange,
  parseCatalogParams,
  serializeProductCard,
  type SearchParams,
} from "@/lib/catalog";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection not found" };
  const url = `${SITE_URL}/collection/${slug}`;
  const description =
    collection.description ??
    `Shop the ${collection.name} collection at AYLI — curated styles for the modern Indian woman.`;
  return {
    title: `${collection.name} — Collection`,
    description,
    alternates: { canonical: url },
    openGraph: { title: collection.name, description, url, type: "website" },
    twitter: { card: "summary_large_image", title: collection.name, description },
  };
}

const PAGE_SIZE = 16;

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
  const current = await searchParams;

  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const catalogParams = parseCatalogParams(current);
  const pathname = `/collection/${slug}`;
  const scopeWhere = {
    collections: { some: { collection: { slug } } },
  };

  const filterKeys: MultiFilterKey[] = [...MULTI_KEYS];

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
        <ErrorState title="Could not load this collection" />
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
        { label: "Collections", href: "/" },
        { label: collection.name },
      ]}
      eyebrow="Collection"
      heading={collection.name}
      description={collection.description}
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