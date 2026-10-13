// Catalog listing skeleton — shown immediately by Next.js Suspense while the
// page server component fetches category/filter/product data from MySQL.
function Pulse({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-soft-beige ${className}`} />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="aspect-[4/5] w-full rounded-xl bg-soft-beige" />
      <div className="space-y-2 px-0.5">
        <Pulse className="h-3.5 w-3/4" />
        <Pulse className="h-3 w-1/3" />
        <Pulse className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Pulse className="mb-6 h-4 w-48" />

      {/* Heading */}
      <Pulse className="mb-2 h-8 w-56" />
      <Pulse className="mb-8 h-4 w-80" />

      {/* Subcategory chips */}
      <div className="mb-6 flex gap-2 overflow-x-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-8 w-24 flex-shrink-0 rounded-full" />
        ))}
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters — hidden on mobile */}
        <aside className="hidden w-56 flex-shrink-0 space-y-4 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Pulse className="h-4 w-24" />
              <Pulse className="h-3 w-full" />
              <Pulse className="h-3 w-5/6" />
              <Pulse className="h-3 w-3/4" />
            </div>
          ))}
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {/* Sort / count bar */}
          <div className="mb-5 flex items-center justify-between">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-8 w-36 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
