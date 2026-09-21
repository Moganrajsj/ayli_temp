function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-soft-beige ${className}`} />;
}

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 pb-6">
        <SkeletonPulse className="h-7 w-44" />
        <SkeletonPulse className="hidden h-4 w-24 sm:block" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-3">
            <div className="aspect-[4/5] w-full rounded-card bg-soft-beige" />
            <div className="space-y-2 px-1">
              <div className="h-3.5 w-3/4 rounded bg-soft-beige" />
              <div className="h-3 w-1/3 rounded bg-soft-beige" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}