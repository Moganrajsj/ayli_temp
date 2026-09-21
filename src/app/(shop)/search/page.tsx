import type { Metadata } from "next";
import { CatalogListingView } from "@/components/catalog/catalog-listing-view";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icons";
import type { MultiFilterKey } from "@/lib/catalog-url";
import { MULTI_KEYS } from "@/lib/catalog-url";
import {
  buildPricePresets,
  getFilterGroups,
  getPriceRange,
  parseCatalogParams,
  serializeProductCard,
  type SearchParams as CatalogSearchParams,
} from "@/lib/catalog";
import {
  buildSearchWhere,
  searchCatalog,
  type SearchSortKey,
  type SearchParams as SearchInputParams,
} from "@/lib/search";

interface SearchPageProps {
  searchParams: Promise<CatalogSearchParams>;
}

export const metadata: Metadata = {
  title: "Search",
};

const PAGE_SIZE = 16;

const SEARCH_SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popularity" },
  { value: "price_asc", label: "Price — Low to High" },
  { value: "price_desc", label: "Price — High to Low" },
];

const SEARCH_SORT_VALUES = new Set(SEARCH_SORT_OPTIONS.map((o) => o.value));

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const current = await searchParams;
  const query = typeof current.q === "string" ? current.q.trim() : "";

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} className="mb-8" />
        <SearchForm initialQuery="" />
        <EmptyState
          icon="search"
          title="Search the AYLI catalogue"
          description="Find styles by name, fabric, colour or occasion — try “blue kurta” or “rayon dress”."
        />
      </div>
    );
  }

  const requestedSort: SearchSortKey = SEARCH_SORT_VALUES.has(current.sort as string)
    ? (current.sort as SearchSortKey)
    : "relevance";
  const catalogParams = parseCatalogParams(current);
  const searchInput: SearchInputParams = {
    ...catalogParams,
    query,
    sort: requestedSort,
  };

  const filterKeys: MultiFilterKey[] = [...MULTI_KEYS];

  let listing;
  let groups;
  let priceRange;
  try {
    [listing, groups, priceRange] = await Promise.all([
      searchCatalog(searchInput, PAGE_SIZE),
      getFilterGroups(buildSearchWhere(query), catalogParams, filterKeys),
      getPriceRange(buildSearchWhere(query), catalogParams),
    ]);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="Search is unavailable right now" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Search" }]}
          className="mb-6"
        />
        <SearchForm initialQuery={query} />
      </div>
      <CatalogListingView
        pathname="/search"
        current={current}
        params={catalogParams}
        breadcrumbs={[]}
        eyebrow="Search"
        heading={`Results for “${query}”`}
        listing={listing}
        groups={groups}
        priceRange={priceRange}
        presets={buildPricePresets(priceRange)}
        sortOptions={SEARCH_SORT_OPTIONS}
        sortValue={searchInput.sort}
        products={listing.products.map(serializeProductCard)}
        emptyTitle={`No results for “${query}”`}
        emptyDescription="Check the spelling, or try a broader term like “dress”, “blue” or “rayon”."
        exploreHref="/"
      />
    </>
  );
}

function SearchForm({ initialQuery }: { initialQuery: string }) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="relative mb-8 animate-fade-up"
    >
      <input
        type="search"
        name="q"
        defaultValue={initialQuery}
        placeholder="Search styles, fabrics, colours…"
        autoComplete="off"
        className="h-14 w-full rounded-card border border-hairline bg-warm-white pl-14 pr-4 text-base text-ink transition-all duration-300 placeholder:text-muted focus:border-ayli-blue focus:shadow-[0_0_0_4px_rgb(91,127,212/0.12)] focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors duration-200 hover:scale-110 hover:text-ayli-blue"
      >
        <Icon name="search" className="h-5 w-5" />
      </button>
    </form>
  );
}