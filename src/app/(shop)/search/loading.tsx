// Search results skeleton.
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

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Pulse className="mb-6 h-4 w-48" />
      {/* Search input placeholder */}
      <Pulse className="mb-8 h-12 w-full max-w-xl rounded-xl" />

      <div className="flex gap-6">
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

        <div className="flex-1">
          <div className="mb-5 flex items-center justify-between">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-8 w-36 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
