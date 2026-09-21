// Category-aware filter configuration.
//
// This file declares WHICH attribute keys apply to each category. It never
// hardcodes product-to-filter groupings — option values and counts are always
// derived live from the catalog (products + variants) at query time.

export type FilterKey =
  | "size"
  | "colour"
  | "fabric"
  | "pattern"
  | "printType"
  | "sleeveType"
  | "neckType"
  | "length"
  | "fit"
  | "occasion"
  | "waist"
  | "rise"
  | "material"
  | "price";

export type FilterType = "multi" | "range";

export interface FilterConfig {
  key: FilterKey;
  label: string;
  type: FilterType;
}

export const FILTER_LABELS: Record<FilterKey, string> = {
  size: "Size",
  colour: "Colour",
  fabric: "Fabric",
  pattern: "Pattern",
  printType: "Print Type",
  sleeveType: "Sleeve",
  neckType: "Neck",
  length: "Length",
  fit: "Fit",
  occasion: "Occasion",
  waist: "Waist",
  rise: "Rise",
  material: "Material",
  price: "Price",
};

const multi = (...keys: Exclude<FilterKey, "price">[]): FilterConfig[] =>
  keys.map((key) => ({ key, label: FILTER_LABELS[key], type: "multi" }));

const PRICE: FilterConfig = { key: "price", label: "Price", type: "range" };

export const CATEGORY_FILTERS: Record<string, FilterConfig[]> = {
  "kurtis-tops": [
    ...multi(
      "size",
      "colour",
      "fabric",
      "pattern",
      "printType",
      "sleeveType",
      "neckType",
      "length",
      "fit",
      "occasion"
    ),
    PRICE,
  ],
  "co-ord-sets": [
    ...multi("size", "colour", "fabric", "pattern", "length", "fit", "occasion"),
    PRICE,
  ],
  "kurta-sets": [
    ...multi("size", "colour", "fabric", "pattern", "length", "fit", "occasion"),
    PRICE,
  ],
  dresses: [
    ...multi("size", "colour", "fabric", "pattern", "sleeveType", "length", "fit", "occasion"),
    PRICE,
  ],
  bottoms: [
    ...multi("size", "colour", "fabric", "pattern", "waist", "rise", "length", "fit"),
    PRICE,
  ],
  fabrics: [...multi("fabric", "pattern", "material", "printType"), PRICE],
  accessories: [...multi("material", "colour", "size", "occasion"), PRICE],
};

export function getCategoryFilters(slug: string): FilterConfig[] {
  return CATEGORY_FILTERS[slug] ?? [PRICE];
}