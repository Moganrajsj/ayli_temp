"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import {
  CatalogFilters,
  type CatalogFiltersProps,
} from "@/components/catalog/catalog-filters";

export type FilterSheetProps = CatalogFiltersProps;

export function FilterSheet(props: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-pill border border-hairline bg-warm-white px-4 text-sm font-medium text-ink transition-colors hover:border-ink/20 hover:bg-soft-beige"
      >
        <Icon name="sliders" className="h-4 w-4" />
        Filter
        {props.activeCount > 0 ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-ayli-blue px-1 text-xs font-semibold text-white">
            {props.activeCount}
          </span>
        ) : null}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        position="bottom"
        size="lg"
        title="Filters"
      >
        <div
          className={cn(
            "px-5 py-1",
            "max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain"
          )}
        >
          <CatalogFilters {...props} />
        </div>
      </Sheet>
    </>
  );
}