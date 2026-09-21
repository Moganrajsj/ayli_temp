import Link from "next/link";
import type { CSSProperties } from "react";
import type {
  CatalogListing,
  CatalogParams,
  FilterGroup,
  PricePreset,
  PriceRange,
  SerializedProductCard,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/catalog/breadcrumbs";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { FilterSheet } from "@/components/catalog/filter-sheet";
import { Pagination } from "@/components/catalog/pagination";
import { SortSelect } from "@/components/catalog/sort-select";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/ui/empty-state";

export interface SortValue {
  value: string;
  label: string;
}

export interface CatalogListingViewProps {
  pathname: string;
  current: Record<string, string | string[] | undefined>;
  params: CatalogParams;
  breadcrumbs: BreadcrumbItem[];
  eyebrow?: string;
  heading: string;
  description?: string | null;
  subcategoryChips?: Array<{
    slug: string;
    name: string;
    productCount: number;
  }>;
  listing: CatalogListing;
  groups: FilterGroup[];
  priceRange: PriceRange;
  presets: PricePreset[];
  sortOptions: SortValue[];
  sortValue: string;
  products: SerializedProductCard[];
  emptyTitle?: string;
  emptyDescription?: string;
  exploreHref?: string;
  chipBasePath?: string;
}

export function CatalogListingView({
  pathname,
  current,
  params,
  breadcrumbs,
  eyebrow,
  heading,
  description,
  subcategoryChips,
  listing,
  groups,
  priceRange,
  presets,
  sortOptions,
  sortValue,
  products,
  emptyTitle = "No styles match these filters",
  emptyDescription = "Try removing a filter or two to widen the hunt.",
  exploreHref = "/category/kurtis-tops",
  chipBasePath,
}: CatalogListingViewProps) {
  const hasActiveCount =
    groups.reduce((n, g) => n + g.options.filter((o) => o.selected).length, 0) +
    (params.priceMin !== undefined || params.priceMax !== undefined ? 1 : 0);

  const showNoResults = listing.total === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-16">
      <Breadcrumbs items={breadcrumbs} className="mb-4" />

      <header className={cn("mb-6", !showNoResults && "animate-fade-up")}>
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ayli-blue">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            {heading}
          </h1>
          <span className="text-sm text-muted">
            {listing.total} {listing.total === 1 ? "style" : "styles"}
          </span>
        </div>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </header>

      {subcategoryChips && subcategoryChips.length > 0 ? (
        <nav
          aria-label="Subcategories"
          className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {subcategoryChips.map((chip) => (
            <Link
              key={chip.slug}
              href={`${chipBasePath}/${chip.slug}`}
              className="shrink-0 rounded-pill border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25 hover:bg-soft-beige"
            >
              {chip.name}
              <span className="ml-1.5 text-xs text-muted">
                {chip.productCount}
              </span>
            </Link>
          ))}
        </nav>
      ) : null}

      {showNoResults ? (
        <EmptyState
          icon="compass"
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Link
              href={exploreHref}
              className="mt-1 inline-flex min-h-11 items-center justify-center rounded-pill bg-ayli-blue px-6 text-sm font-medium text-white transition-colors hover:bg-[#1ba9bc]"
            >
              Browse new arrivals
            </Link>
          }
        />
      ) : (
        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
              <CatalogFilters
                pathname={pathname}
                current={current}
                groups={groups}
                priceRange={priceRange}
                presets={presets}
                activeCount={hasActiveCount}
                resultCount={listing.total}
              />
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-6 flex items-center gap-3">
              <div className="lg:hidden">
                <FilterSheet
                  pathname={pathname}
                  current={current}
                  groups={groups}
                  priceRange={priceRange}
                  presets={presets}
                  activeCount={hasActiveCount}
                  resultCount={listing.total}
                />
              </div>
              <div className="flex-1 lg:flex-none">
                <SortSelect
                  options={sortOptions}
                  value={sortValue}
                  pathname={pathname}
                  current={current}
                />
              </div>
            </div>

            {products.length > 0 ? (
              <ProductGrid className="stagger-grid">
                {products.map((product, i) => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    style={{ "--stagger-i": i } as CSSProperties}
                  />
                ))}
              </ProductGrid>
            ) : null}

            <Pagination
              pathname={pathname}
              current={current}
              currentPage={listing.page}
              pageCount={listing.pageCount}
              className="mt-10"
            />
          </section>
        </div>
      )}
    </div>
  );
}