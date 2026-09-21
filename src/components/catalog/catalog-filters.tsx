"use client";

import Link from "next/link";
import { buildCatalogUrl } from "@/lib/catalog-url";
import { cn } from "@/lib/utils";
import type {
  FilterGroup,
  PricePreset,
  PriceRange,
} from "@/lib/catalog";

export interface CatalogFiltersProps {
  pathname: string;
  current: Record<string, string | string[] | undefined>;
  groups: FilterGroup[];
  priceRange: PriceRange;
  presets: PricePreset[];
  activeCount: number;
  resultCount: number;
}

/**
 * Filter panel content (used in the desktop sidebar and within the mobile
 * bottom sheet). Every option is a real <Link> built from the URL-driven
 * state — selections navigate without any JS, keeping the panel progressive.
 */
export function CatalogFilters({
  pathname,
  current,
  groups,
  priceRange,
  presets,
  activeCount,
  resultCount,
}: CatalogFiltersProps) {
  const priceSelected = (preset: PricePreset): boolean => {
    const currentMin = typeof current.priceMin === "string" ? Number(current.priceMin) : null;
    const currentMax = typeof current.priceMax === "string" ? Number(current.priceMax) : null;
    if (preset.min === null && preset.max === null) {
      return currentMin === null && currentMax === null;
    }
    return currentMin === preset.min && currentMax === preset.max;
  };

  const priceHref = (preset: PricePreset) =>
    buildCatalogUrl(pathname, current, {
      setPrice: [preset.min ?? priceRange.min, preset.max ?? priceRange.max],
    });

  const selectedCount = activeCount > 0 ? activeCount : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {resultCount} {resultCount === 1 ? "stylish style" : "stylish styles"}
        </p>
        {selectedCount > 0 ? (
          <Link
            href={buildCatalogUrl(pathname, current, { clearAll: true })}
            className="text-sm font-medium text-ayli-blue hover:text-[#1496a8]"
          >
            Clear all ({selectedCount})
          </Link>
        ) : null}
      </div>

      {groups.map((group) => (
        <fieldset key={group.key} className="border-t border-hairline py-4">
          <legend className="mb-3 text-sm font-semibold text-ink">
            {group.label}
          </legend>
          <div
            className={cn(
              group.key === "colour"
                ? "flex flex-wrap gap-2.5"
                : "space-y-1"
            )}
          >
            {group.options.map((option) => {
              const href = buildCatalogUrl(pathname, current, {
                toggle: { key: group.key, value: option.value },
              });
              return (
                <Link
                  key={`${group.key}-${option.value}`}
                  href={href}
                  aria-pressed={option.selected}
                  className={cn(
                    option.selected
                      ? "border-ayli-blue bg-ayli-blue/10 text-ink"
                      : "border-hairline text-ink hover:border-muted",
                    group.key === "colour"
                      ? "relative grid h-9 w-9 place-items-center rounded-full border transition-transform hover:scale-105"
                      : "flex items-center justify-between gap-3 rounded-pill border px-3 py-2 text-sm transition-colors"
                  )}
                >
                  {group.key === "colour" ? (
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 rounded-full border border-ink/10"
                      style={{
                        backgroundColor: option.swatch ?? "#f0f0f0",
                      }}
                    />
                  ) : (
                    <>
                      <span>{option.label}</span>
                      <span className="text-xs text-muted">({option.count})</span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </fieldset>
      ))}

      <fieldset className="border-t border-hairline py-4">
        <legend className="mb-3 text-sm font-semibold text-ink">Price</legend>
        <div className="space-y-1">
          <Link
            href={buildCatalogUrl(pathname, current, { setPrice: null })}
            aria-pressed={priceSelected({ label: "", min: null, max: null })}
            className={cn(
              "flex items-center justify-between gap-3 rounded-pill border px-3 py-2 text-sm transition-colors",
              !current.priceMin && !current.priceMax
                ? "border-ayli-blue bg-ayli-blue/10 text-ink"
                : "border-hairline text-ink hover:border-muted"
            )}
          >
            <span>All prices</span>
            <span className="text-xs text-muted">
              {resultCount}
            </span>
          </Link>
          {presets.map((preset) => (
            <Link
              key={preset.label}
              href={priceHref(preset)}
              aria-pressed={priceSelected(preset)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-pill border px-3 py-2 text-sm transition-colors",
                priceSelected(preset)
                  ? "border-ayli-blue bg-ayli-blue/10 text-ink"
                  : "border-hairline text-ink hover:border-muted"
              )}
            >
              <span>{preset.label}</span>
            </Link>
          ))}
        </div>
      </fieldset>
    </div>
  );
}