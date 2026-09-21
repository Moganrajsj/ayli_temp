"use client";

import { useRouter } from "next/navigation";
import { buildCatalogUrl } from "@/lib/catalog-url";
import { Icon } from "@/components/ui/icons";

export interface SortOption {
  value: string;
  label: string;
}

export interface SortSelectProps {
  options: SortOption[];
  value: string;
  pathname: string;
  current: Record<string, string | string[] | undefined>;
}

export function SortSelect({ options, value, pathname, current }: SortSelectProps) {
  const router = useRouter();

  const handleChange = (nextSort: string) => {
    router.replace(
      buildCatalogUrl(pathname, current, { sort: nextSort }),
      { scroll: false }
    );
  };

  return (
    <div className="relative w-full sm:w-56">
      <label htmlFor="sort" className="sr-only">
        Sort products
      </label>
      <select
        id="sort"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-card border border-hairline bg-warm-white pl-4 pr-10 text-sm font-medium text-ink transition-colors hover:border-ink/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ayli-blue"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}