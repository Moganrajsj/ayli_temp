// Product detail skeleton — shown immediately while product data loads.
function Pulse({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-soft-beige ${className}`} />
  );
}

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Pulse className="mb-6 h-4 w-56" />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-soft-beige" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-16 animate-pulse rounded-lg bg-soft-beige"
              />
            ))}
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-5">
          <Pulse className="h-4 w-24" />
          <Pulse className="h-8 w-3/4" />
          <Pulse className="h-5 w-32" />
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-5/6" />

          {/* Colour swatches */}
          <div>
            <Pulse className="mb-2 h-4 w-20" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-8 animate-pulse rounded-full bg-soft-beige"
                />
              ))}
            </div>
          </div>

          {/* Size buttons */}
          <div>
            <Pulse className="mb-2 h-4 w-16" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Pulse key={i} className="h-9 w-14 rounded-lg" />
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="space-y-3 pt-2">
            <Pulse className="h-12 w-full rounded-xl" />
            <Pulse className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Related products */}
      <div className="mt-16">
        <Pulse className="mb-6 h-7 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-[4/5] w-full rounded-xl bg-soft-beige" />
              <Pulse className="h-3.5 w-3/4" />
              <Pulse className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
