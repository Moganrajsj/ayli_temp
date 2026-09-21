// Pure URL helpers for the catalog listing — no Prisma, safe for client components.
import type { FilterKey } from "@/config/categories";

export type MultiFilterKey = Exclude<FilterKey, "price">;

export const MULTI_KEYS: MultiFilterKey[] = [
  "fabric",
  "pattern",
  "printType",
  "sleeveType",
  "neckType",
  "length",
  "fit",
  "occasion",
  "waist",
  "rise",
  "material",
  "size",
  "colour",
];

export const CONSTANT_KEYS = [
  "fabric",
  "pattern",
  "printType",
  "sleeveType",
  "neckType",
  "length",
  "fit",
  "occasion",
  "waist",
  "rise",
  "material",
] as const satisfies readonly MultiFilterKey[];

export const VARIANT_KEYS = ["size", "colour"] as const satisfies readonly MultiFilterKey[];

export const CONSTANT_KEY_SET = new Set<string>(CONSTANT_KEYS);
export const VARIANT_KEY_SET = new Set<string>(VARIANT_KEYS);

export function splitMulti(value?: string | string[] | null): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : value.split(",");
  return Array.from(new Set(raw.map((s) => s.trim()).filter(Boolean)));
}

export function validPage(value?: string | null): number {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(raw, 10000);
}

export interface CatalogPatch {
  toggle?: { key: MultiFilterKey; value: string };
  clear?: MultiFilterKey[];
  clearAll?: boolean;
  setPrice?: [number, number] | null;
  sort?: string;
  page?: number;
}

/**
 * Builds a catalog listing URL (search params only — `basePathname` is kept
 * as-is) from the current query record plus a mutation.
 */
export function buildCatalogUrl(
  basePathname: string,
  current: Record<string, string | string[] | undefined>,
  patch: CatalogPatch = {}
): string {
  const params = new URLSearchParams();

  for (const key of MULTI_KEYS) {
    for (const value of splitMulti(current[key])) params.append(key, value);
  }

  if (!patch.clearAll) {
    if (patch.toggle) {
      const key = patch.toggle.key;
      const values = splitMulti(current[key]).filter((v) => v !== patch.toggle!.value);
      if (!values.includes(patch.toggle.value)) values.push(patch.toggle.value);
      params.delete(key);
      for (const value of values) params.append(key, value);
    }
    for (const key of patch.clear ?? []) params.delete(key);

    const hasPriceSelection =
      typeof current.priceMin === "string" && typeof current.priceMax === "string";
    if (patch.setPrice === null) {
      params.delete("priceMin");
      params.delete("priceMax");
    } else if (patch.setPrice) {
      params.set("priceMin", String(patch.setPrice[0]));
      params.set("priceMax", String(patch.setPrice[1]));
    } else if (hasPriceSelection) {
      params.set("priceMin", String(current.priceMin));
      params.set("priceMax", String(current.priceMax));
    }
  }

  const sort = patch.sort ?? (typeof current.sort === "string" ? current.sort : undefined);
  if (sort && sort !== "newest") params.set("sort", sort);

  const changedFilters =
    patch.clearAll ||
    Boolean(patch.toggle) ||
    Boolean(patch.clear?.length) ||
    patch.setPrice !== undefined ||
    Boolean(patch.sort);

  const page = patch.page ?? (typeof current.page === "string" ? Number(current.page) : 1);
  if (page > 1 && !changedFilters) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `${basePathname}?${qs}` : basePathname;
}