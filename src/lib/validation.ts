import { z } from "zod";

// Shared validation helpers so both server-action modules (account + order)
// can reuse the same address rules without exporting values from "use server"
// files (which may only export async functions).

export const addressSchema = z.object({
  id: z.string().trim().nullish().transform((v) => v || undefined),
  name: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().min(1, "Please enter a recipient name.").max(80)
  ),
  phone: z.preprocess(
    (v) => {
      if (typeof v !== "string") return "";
      let cleaned = v.trim().replace(/[\s\-\(\)\+]/g, "");
      if (cleaned.startsWith("91") && cleaned.length === 12) cleaned = cleaned.slice(2);
      else if (cleaned.startsWith("0") && cleaned.length === 11) cleaned = cleaned.slice(1);
      return cleaned;
    },
    z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number.")
  ),
  line1: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().min(1, "Address line 1 is required.").max(200)
  ),
  line2: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().max(200).default("")
  ),
  city: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().min(1, "City is required.").max(80)
  ),
  state: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().min(1, "State is required.").max(80)
  ),
  pincode: z.preprocess(
    (v) => {
      if (typeof v !== "string") return "";
      return v.trim().replace(/[\s\-]/g, "");
    },
    z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit pincode.")
  ),
  country: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.trim() : "India"),
    z.string().default("India")
  ),
  isDefault: z
    .union([
      z.literal("on"),
      z.literal("true"),
      z.literal("1"),
      z.literal("false"),
      z.literal("0"),
      z.boolean(),
    ])
    .nullish()
    .transform((v) => v === true || v === "on" || v === "true" || v === "1"),
});

export function formatFieldErrors(
  issues: z.ZodIssue[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of issues) {
    // Build full dot-path key so nested errors like variants.0.colour are preserved
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!map[key]) map[key] = issue.message;
  }
  return map;
}

/* ───────── Admin catalog schemas ───────── */

export const productImageSchema = z.object({
  url: z.string().trim().min(1, "Image URL is required."),
  alt: z.string().trim().max(200).optional().default(""),
  colour: z.string().trim().max(80).optional().nullable(),
  isMain: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const variantFormSchema = z.object({
  colour: z.string().trim().min(1, "Colour is required."),
  colourHex: z.string().trim().max(9).optional().nullable(),
  size: z.string().trim().min(1, "Size is required."),
  sku: z.string().trim().min(1, "Variant SKU is required.").max(80),
  barcode: z.string().trim().max(80).optional().nullable(),
  price: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).max(99999).default(0),
  active: z.boolean().optional().default(true),
});

export const adminProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only."),
  sku: z.string().trim().min(1, "Product SKU is required.").max(80),
  brand: z.string().trim().max(120).optional().nullable(),
  productType: z.string().trim().max(120).optional().nullable(),
  categoryId: z.string().trim().min(1, "Category is required."),
  subcategoryId: z.string().trim().optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  mrp: z.coerce.number().positive("MRP must be greater than 0."),
  sellingPrice: z.coerce.number().positive("Selling price must be greater than 0."),
  costPrice: z.coerce.number().positive().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  fabric: z.string().trim().max(80).optional().nullable(),
  pattern: z.string().trim().max(80).optional().nullable(),
  printType: z.string().trim().max(80).optional().nullable(),
  sleeveType: z.string().trim().max(80).optional().nullable(),
  neckType: z.string().trim().max(80).optional().nullable(),
  length: z.string().trim().max(80).optional().nullable(),
  fit: z.string().trim().max(80).optional().nullable(),
  waist: z.string().trim().max(80).optional().nullable(),
  rise: z.string().trim().max(80).optional().nullable(),
  occasion: z.string().trim().max(80).optional().nullable(),
  material: z.string().trim().max(80).optional().nullable(),
  transparency: z.string().trim().max(80).optional().nullable(),
  stretchability: z.string().trim().max(80).optional().nullable(),
  washCare: z.string().max(2000).optional().nullable(),
  sizeChartUrl: z.string().url("Enter a valid URL.").optional().nullable().or(z.literal("")),
  sizeChartData: z.string().optional().nullable(),
  modelInfo: z.string().trim().max(500).optional().nullable(),
  garmentMeasurements: z.string().max(2000).optional().nullable(),
  productMeasurements: z.string().max(2000).optional().nullable(),
  countryOfOrigin: z.string().trim().max(80).default("India"),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  images: z.array(productImageSchema).max(12),
  variants: z.array(variantFormSchema).max(300),
  collectionIds: z.array(z.string()).max(30),
});

export const adminCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only."),
  description: z.string().trim().max(500).optional().default(""),
  image: z.string().trim().max(2000).optional().default(""),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const adminSubcategorySchema = z.object({
  categoryId: z.string().trim().min(1, "Category is required."),
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only."),
  description: z.string().trim().max(500).optional().default(""),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const adminCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only."),
  description: z.string().trim().max(500).optional().default(""),
  image: z.string().trim().max(2000).optional().default(""),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

/* ───────── Shared admin payload types ───────── */

export interface AdminImageInput {
  url: string;
  alt?: string;
  colour?: string | null;
  isMain?: boolean;
  sortOrder?: number;
}

export interface AdminVariantInput {
  colour: string;
  colourHex?: string | null;
  size: string;
  sku: string;
  barcode?: string | null;
  price?: number | null;
  stock: number;
  active?: boolean;
}

export interface AdminProductInput {
  name: string;
  slug: string;
  sku: string;
  brand?: string | null;
  productType?: string | null;
  categoryId: string;
  subcategoryId?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  mrp: number;
  sellingPrice: number;
  costPrice?: number | null;
  taxRate?: number;
  fabric?: string | null;
  pattern?: string | null;
  printType?: string | null;
  sleeveType?: string | null;
  neckType?: string | null;
  length?: string | null;
  fit?: string | null;
  waist?: string | null;
  rise?: string | null;
  occasion?: string | null;
  material?: string | null;
  transparency?: string | null;
  stretchability?: string | null;
  washCare?: string | null;
  sizeChartUrl?: string | null;
  sizeChartData?: string | null;
  modelInfo?: string | null;
  garmentMeasurements?: string | null;
  productMeasurements?: string | null;
  countryOfOrigin?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  images: AdminImageInput[];
  variants: AdminVariantInput[];
  collectionIds: string[];
}

export interface AdminActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}