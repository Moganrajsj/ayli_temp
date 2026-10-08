"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction } from "@/actions/admin.action";
import type { AdminCategoryOption, AdminCollectionOption, AdminProductDetail } from "@/lib/admin";
import type { AdminActionResult, AdminProductInput } from "@/lib/validation";
import {
  COLOUR_SWATCHES,
  FABRIC_OPTIONS,
  FIT_OPTIONS,
  LENGTH_OPTIONS,
  MATERIAL_OPTIONS,
  NECK_OPTIONS,
  OCCASION_OPTIONS,
  PATTERN_OPTIONS,
  PRODUCT_SIZES,
  RISE_OPTIONS,
  SLEEVE_OPTIONS,
  STRETCHABILITY_OPTIONS,
  TRANSPARENCY_OPTIONS,
  WAIST_OPTIONS,
} from "@/config/product-options";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icons";
import { cn, slugify } from "@/lib/utils";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initial: AdminProductDetail | null;
  categories: AdminCategoryOption[];
  collections: AdminCollectionOption[];
}

interface VariantRow {
  key: number;
  colour: string;
  colourHex: string;
  size: string;
  sku: string;
  price: string;
  stock: string;
  barcode: string;
  active: boolean;
}

interface ImageRow {
  key: number;
  url: string;
  alt: string;
  colour: string;
  isMain: boolean;
}

interface SizeChart {
  headers: string[];
  rows: string[][];
}

const DEFAULT_SIZE_CHART: SizeChart = {
  headers: ["Size", "Chest", "Waist", "Hips", "Length"],
  rows: [],
};

let rowId = 0;
const nextRow = () => ++rowId;

// Dropdown attribute definitions for extended attributes
const ATTR_DROPDOWNS: { key: string; label: string; options: readonly string[] }[] = [
  { key: "length", label: "Length", options: LENGTH_OPTIONS },
  { key: "fit", label: "Fit", options: FIT_OPTIONS },
  { key: "waist", label: "Waist", options: WAIST_OPTIONS },
  { key: "rise", label: "Rise", options: RISE_OPTIONS },
  { key: "occasion", label: "Occasion", options: OCCASION_OPTIONS },
  { key: "material", label: "Material", options: MATERIAL_OPTIONS },
  { key: "transparency", label: "Transparency", options: TRANSPARENCY_OPTIONS },
  { key: "stretchability", label: "Stretchability", options: STRETCHABILITY_OPTIONS },
];

function emptyVariant(skuPrefix = ""): VariantRow {
  return {
    key: nextRow(),
    colour: "",
    colourHex: "",
    size: "",
    sku: skuPrefix ? `${skuPrefix}-S` : "",
    price: "",
    stock: "0",
    barcode: "",
    active: true,
  };
}

function emptyImage(): ImageRow {
  return { key: nextRow(), url: "", alt: "", colour: "", isMain: false };
}

function parseSizeChart(raw: string | null | undefined): SizeChart {
  if (!raw) return DEFAULT_SIZE_CHART;
  try {
    const parsed = JSON.parse(raw) as SizeChart;
    if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) return parsed;
  } catch {}
  return DEFAULT_SIZE_CHART;
}

export function ProductForm({ mode, productId, initial, categories, collections }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          sku: initial.sku,
          brand: initial.brand ?? "",
          productType: initial.productType ?? "",
          categoryId: initial.categoryId,
          subcategoryId: initial.subcategoryId ?? "",
          shortDescription: initial.shortDescription ?? "",
          description: initial.description ?? "",
          mrp: String(initial.mrp),
          sellingPrice: String(initial.sellingPrice),
          taxRate: String(initial.taxRate),
          countryOfOrigin: initial.countryOfOrigin,
          sizeChartUrl: initial.sizeChartUrl ?? "",
          modelInfo: initial.modelInfo ?? "",
          garmentMeasurements: initial.garmentMeasurements ?? "",
          productMeasurements: initial.productMeasurements ?? "",
          washCare: initial.washCare ?? "",
          isActive: initial.isActive,
          isFeatured: initial.isFeatured,
        }
      : {
          name: "",
          slug: "",
          sku: "",
          brand: "",
          productType: "",
          categoryId: categories[0]?.id ?? "",
          subcategoryId: "",
          shortDescription: "",
          description: "",
          mrp: "",
          sellingPrice: "",
          taxRate: "0",
          countryOfOrigin: "India",
          sizeChartUrl: "",
          modelInfo: "",
          garmentMeasurements: "",
          productMeasurements: "",
          washCare: "",
          isActive: true,
          isFeatured: false,
        },
  );

  // Dropdown attributes
  const [fabric, setFabric] = useState(initial?.fabric ?? "");
  const [pattern, setPattern] = useState(initial?.pattern ?? "");
  const [sleeveType, setSleeveType] = useState(initial?.sleeveType ?? "");
  const [neckType, setNeckType] = useState(initial?.neckType ?? "");

  // Dropdown attributes state
  const [attrs, setAttrs] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const item of ATTR_DROPDOWNS) base[item.key] = "";
    if (initial) {
      for (const item of ATTR_DROPDOWNS) {
        base[item.key] = String((initial as unknown as Record<string, unknown>)[item.key] ?? "");
      }
    }
    return base;
  });

  // Discount % field — computed from initial MRP / sellingPrice
  const [discountPct, setDiscountPct] = useState<string>(() => {
    const mrp = Number(initial?.mrp ?? 0);
    const sp = Number(initial?.sellingPrice ?? 0);
    if (mrp > 0 && sp > 0 && sp < mrp) {
      return String(Math.round(((mrp - sp) / mrp) * 100));
    }
    return "";
  });

  const handleMrpChange = (val: string) => {
    setForm((f) => {
      const mrp = Number(val);
      const pct = Number(discountPct);
      const nextSp = mrp > 0 && pct > 0 && pct < 100
        ? String(Math.round(mrp * (1 - pct / 100)))
        : f.sellingPrice;
      return { ...f, mrp: val, sellingPrice: nextSp };
    });
  };

  const handleDiscountChange = (val: string) => {
    setDiscountPct(val);
    const mrp = Number(form.mrp);
    const pct = Number(val);
    if (mrp > 0 && pct >= 0 && pct < 100) {
      setForm((f) => ({ ...f, sellingPrice: String(Math.round(mrp * (1 - pct / 100))) }));
    }
  };

  const handleSellingPriceChange = (val: string) => {
    setForm((f) => ({ ...f, sellingPrice: val }));
    const mrp = Number(form.mrp);
    const sp = Number(val);
    if (mrp > 0 && sp > 0 && sp <= mrp) {
      setDiscountPct(String(Math.round(((mrp - sp) / mrp) * 100)));
    } else {
      setDiscountPct("");
    }
  };

  // Size chart state
  const [sizeChart, setSizeChart] = useState<SizeChart>(() =>
    parseSizeChart(initial?.sizeChartData),
  );

  // No seeded blank row: uploading via drag & drop must not leave a phantom empty
  // image behind (blank rows are dropped again in buildPayload).
  const [images, setImages] = useState<ImageRow[]>(() =>
    initial
      ? initial.images.map((img) => ({ key: nextRow(), url: img.url, alt: img.alt ?? "", colour: img.colour ?? "", isMain: img.isMain }))
      : [],
  );

  const [uploadQueue, setUploadQueue] = useState<{ id: number; name: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActiveMain, setDragActiveMain] = useState(false);
  const [dragActiveOther, setDragActiveOther] = useState(false);
  const [dragImageKey, setDragImageKey] = useState<number | null>(null);
  const mainFileInputRef = useRef<HTMLInputElement | null>(null);
  const otherFileInputRef = useRef<HTMLInputElement | null>(null);

  const [variants, setVariants] = useState<VariantRow[]>(() =>
    initial && initial.variants.length > 0
      ? initial.variants.map((v) => ({
          key: nextRow(),
          colour: v.colour,
          colourHex: v.colourHex ?? "",
          size: v.size,
          sku: v.sku,
          price: v.price != null ? String(v.price) : "",
          stock: String(v.stock),
          barcode: v.barcode ?? "",
          active: v.isActive,
        }))
      : [emptyVariant(initial?.sku ?? "")],
  );

  const [collectionIds, setCollectionIds] = useState<string[]>(initial?.collectionIds ?? []);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedColours, setSelectedColours] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customColour, setCustomColour] = useState({ name: "", hex: "#8B6F5E" });
  const [customSizes, setCustomSizes] = useState("");
  const [batchStock, setBatchStock] = useState("0");
  const [allStockValue, setAllStockValue] = useState("");
  const autogenSlug = useRef(true);

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const activeSubcategories = useMemo(() => {
    const cat = categories.find((c) => c.id === form.categoryId);
    return cat?.subcategories ?? [];
  }, [categories, form.categoryId]);

  const displayDiscount = useMemo(() => {
    const mrp = Number(form.mrp);
    const sp = Number(form.sellingPrice);
    if (!mrp || !sp || sp > mrp) return null;
    return Math.round(((mrp - sp) / mrp) * 100);
  }, [form.mrp, form.sellingPrice]);

  const totalUnits = useMemo(
    () => variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    [variants],
  );

  const availableColours = useMemo(() => {
    const list = variants.map((v) => v.colour.trim()).filter(Boolean);
    return [...new Set(list)];
  }, [variants]);

  function onNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      ...(autogenSlug.current ? { slug: slugify(value) } : {}),
    }));
  }

  function addVariant() {
    setVariants((v) => [...v, emptyVariant(form.sku.trim() || initial?.sku)]);
  }

  function toggleSelectedColour(name: string) {
    setSelectedColours((list) =>
      list.includes(name) ? list.filter((c) => c !== name) : [...list, name],
    );
  }

  function toggleSelectedSize(size: string) {
    setSelectedSizes((list) =>
      list.includes(size) ? list.filter((s) => s !== size) : [...list, size],
    );
  }

  function addBuiltVariants() {
    const customSizeTokens = customSizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const customColourName = customColour.name.trim();
    const colours = selectedColours;
    const sizes = [...new Set([...selectedSizes, ...customSizeTokens])];
    const colourSet = colours;
    if (colourSet.length === 0 || sizes.length === 0) return;

    const hexFor = (name: string) =>
      COLOUR_SWATCHES.find((s) => s.name === name)?.hex ??
      (name === customColourName && customColour.hex.startsWith("#")
        ? customColour.hex
        : null);

    const skuPrefix = form.sku.trim() || initial?.sku || "PRD";
    const stock = Math.max(0, Math.floor(Number(batchStock) || 0));

    const newRows: VariantRow[] = [];
    for (const colour of colourSet) {
      for (const size of sizes) {
        const existing =
          variants.some((v) => v.colour === colour && v.size === size) ||
          newRows.some((v) => v.colour === colour && v.size === size);
        if (existing) continue;
        const row = emptyVariant(skuPrefix);
        row.colour = colour;
        row.colourHex = hexFor(colour) ?? "";
        row.size = size;
        row.sku = `${skuPrefix}-${size}`;
        row.stock = String(stock);
        newRows.push(row);
      }
    }
    if (newRows.length === 0) return;

    setVariants((vs) => [...vs, ...newRows]);
    setSelectedColours([]);
    setSelectedSizes([]);
    setCustomSizes("");
    setCustomColour((c) => ({ ...c, name: "" }));
    setBatchStock("0");
  }

  function applyStockToAll() {
    const value = Number(allStockValue);
    if (!Number.isFinite(value) || value < 0 || value > 99999) return;
    setVariants((vs) => vs.map((v) => ({ ...v, stock: String(Math.floor(value)) })));
  }

  async function uploadFiles(fileList: FileList | File[], options?: { isMain?: boolean }) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setUploadError(null);
    const ids = files.map(() => nextRow());
    setUploadQueue((q) => [
      ...q,
      ...files.map((f, i) => ({ id: ids[i], name: f.name })),
    ]);

    const uploaded: Array<{ key: number; url: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("files", files[i]);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = (await res.json()) as {
          ok?: boolean;
          files?: Array<{ url: string }>;
          error?: string;
        };
        if (res.ok && data.ok && data.files && data.files.length > 0) {
          uploaded.push({ key: ids[i], url: data.files[0].url });
        } else {
          setUploadError((e) => e ?? data.error ?? `"${files[i].name}" could not be uploaded.`);
        }
      } catch {
        setUploadError((e) => e ?? `"${files[i].name}" could not be uploaded.`);
      } finally {
        setUploadQueue((q) => q.filter((x) => x.id !== ids[i]));
      }
    }

    if (uploaded.length === 0) return;
    setImages((imgs) => {
      const kept = imgs.filter((img) => img.url.trim());
      if (options?.isMain) {
        // Uploaded into Main Image slot: the first file becomes the primary cover at index 0
        const [firstMain, ...restUploaded] = uploaded;
        const newMainRow: ImageRow = {
          key: firstMain.key,
          url: firstMain.url,
          alt: "",
          colour: "",
          isMain: true,
        };
        const restRows: ImageRow[] = restUploaded.map((u) => ({
          key: u.key,
          url: u.url,
          alt: "",
          colour: "",
          isMain: false,
        }));
        // Existing images demoted from main
        const existingDemoted = kept.map((img) => ({ ...img, isMain: false }));
        return [newMainRow, ...existingDemoted, ...restRows];
      } else {
        // Uploaded into Other Images slot: append to gallery
        const hasExistingMain = kept.some((img) => img.isMain);
        const newRows: ImageRow[] = uploaded.map((u, i) => ({
          key: u.key,
          url: u.url,
          alt: "",
          colour: "",
          isMain: !hasExistingMain && kept.length === 0 && i === 0,
        }));
        return [...kept, ...newRows];
      }
    });
  }

  function moveImage(fromKey: number, toKey: number) {
    setImages((imgs) => {
      const from = imgs.findIndex((img) => img.key === fromKey);
      const to = imgs.findIndex((img) => img.key === toKey);
      if (from < 0 || to < 0 || from === to) return imgs;
      const reordered = [...imgs];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      // Index 0 always stays as main
      return reordered.map((img, idx) => ({
        ...img,
        isMain: idx === 0,
      }));
    });
  }

  function updateVariant(key: number, patch: Partial<VariantRow>) {
    setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function updateImage(key: number, patch: Partial<ImageRow>) {
    if (patch.isMain) {
      setImages((imgs) => {
        const target = imgs.find((img) => img.key === key);
        if (!target) return imgs;
        const rest = imgs.filter((img) => img.key !== key).map((img) => ({ ...img, isMain: false }));
        return [{ ...target, ...patch, isMain: true }, ...rest];
      });
    } else {
      setImages((imgs) =>
        imgs.map((img) => (img.key === key ? { ...img, ...patch } : img)),
      );
    }
  }

  // ── Size chart helpers ──────────────────────────────────────────────────────
  function updateChartHeader(colIdx: number, value: string) {
    setSizeChart((sc) => {
      const headers = [...sc.headers];
      headers[colIdx] = value;
      return { ...sc, headers };
    });
  }

  function addChartColumn() {
    setSizeChart((sc) => ({
      headers: [...sc.headers, `Col ${sc.headers.length + 1}`],
      rows: sc.rows.map((row) => [...row, ""]),
    }));
  }

  function removeChartColumn(colIdx: number) {
    if (sizeChart.headers.length <= 1) return;
    setSizeChart((sc) => ({
      headers: sc.headers.filter((_, i) => i !== colIdx),
      rows: sc.rows.map((row) => row.filter((_, i) => i !== colIdx)),
    }));
  }

  function addChartRow() {
    setSizeChart((sc) => ({
      ...sc,
      rows: [...sc.rows, Array(sc.headers.length).fill("") as string[]],
    }));
  }

  function removeChartRow(rowIdx: number) {
    setSizeChart((sc) => ({
      ...sc,
      rows: sc.rows.filter((_, i) => i !== rowIdx),
    }));
  }

  function updateChartCell(rowIdx: number, colIdx: number, value: string) {
    setSizeChart((sc) => {
      const rows = sc.rows.map((row, ri) =>
        ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? value : cell)) : row,
      );
      return { ...sc, rows };
    });
  }

  function buildPayload(): AdminProductInput {
    return {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      sku: form.sku.trim().toUpperCase(),
      brand: form.brand.trim() || null,
      productType: form.productType.trim() || null,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || null,
      shortDescription: form.shortDescription.trim() || null,
      description: form.description.trim() || null,
      mrp: Number(form.mrp),
      sellingPrice: Number(form.sellingPrice),
      costPrice: null,
      taxRate: Number(form.taxRate || 0),
      countryOfOrigin: form.countryOfOrigin.trim() || "India",
      sizeChartUrl: null,
      sizeChartData:
        sizeChart.headers.length > 0 || sizeChart.rows.length > 0
          ? JSON.stringify(sizeChart)
          : null,
      modelInfo: form.modelInfo.trim() || null,
      garmentMeasurements: form.garmentMeasurements.trim() || null,
      productMeasurements: form.productMeasurements.trim() || null,
      washCare: form.washCare.trim() || null,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      // Dropdown attributes
      fabric: fabric.trim() || null,
      pattern: pattern.trim() || null,
      printType: null,
      sleeveType: sleeveType.trim() || null,
      neckType: neckType.trim() || null,
      // Free text attributes
      length: attrs.length.trim() || null,
      fit: attrs.fit.trim() || null,
      waist: attrs.waist.trim() || null,
      rise: attrs.rise.trim() || null,
      occasion: attrs.occasion.trim() || null,
      material: attrs.material.trim() || null,
      transparency: attrs.transparency.trim() || null,
      stretchability: attrs.stretchability.trim() || null,
      images: images
        .filter((img) => img.url.trim())
        .map((img, i) => ({
          url: img.url.trim(),
          alt: img.alt.trim() || "",
          colour: img.colour.trim() || null,
          isMain: img.isMain || i === 0,
          sortOrder: i,
        })),
      variants: variants.map((v) => ({
        colour: v.colour.trim(),
        colourHex: v.colourHex.trim() || null,
        size: v.size.trim(),
        sku: v.sku.trim().toUpperCase(),
        barcode: v.barcode.trim() || null,
        price: v.price ? Number(v.price) : null,
        stock: Number(v.stock || 0),
        active: v.active,
      })),
      collectionIds,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (uploadQueue.length > 0) {
      setResult({ ok: false, message: "Please wait for the images to finish uploading." });
      return;
    }
    setPending(true);
    const payload = buildPayload();
    const res = mode === "create" ? await createProductAction(payload) : await updateProductAction(productId!, payload);
    setResult(res);
    setPending(false);
    if (res.ok) {
      router.refresh();
      if (mode === "create" && res.id) {
        router.push(`/admin/products/${res.id}/edit`);
      }
    } else {
      // Scroll to top so the error banner is visible
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Shorthand accessor for field errors
  const fe = result?.fieldErrors ?? {};
  const hasErrors = result && !result.ok;

  // Derive which sections have errors to highlight their borders
  const basicFields = ["name", "slug", "sku", "brand", "productType", "categoryId", "subcategoryId"];
  const pricingFields = ["mrp", "sellingPrice", "taxRate"];
  const descriptionFields = ["shortDescription", "description", "washCare", "modelInfo", "garmentMeasurements", "productMeasurements", "countryOfOrigin"];
  const hasBasicError = basicFields.some((f) => !!fe[f]);
  const hasPricingError = pricingFields.some((f) => !!fe[f]);
  const hasDescriptionError = descriptionFields.some((f) => !!fe[f]);
  const hasImageError = !!fe["images"] || Object.keys(fe).some((k) => k.startsWith("images."));
  const hasVariantError = !!fe["variants"] || Object.keys(fe).some((k) => k.startsWith("variants."));

  // Collect human-readable error list for the banner
  const errorEntries = Object.entries(fe);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {hasErrors ? (
        <div role="alert" className="rounded-card border border-danger/40 bg-danger/5 px-4 py-4 text-sm text-danger">
          <p className="mb-2 font-semibold">{result.message ?? "Please fix the errors below."}</p>
          {errorEntries.length > 0 ? (
            <ul className="ml-4 list-disc space-y-1">
              {errorEntries.map(([field, msg]) => (
                <li key={field}>
                  <span className="font-medium capitalize">{field.replace(/\./g, " › ").replace(/_/g, " ")}:</span>{" "}
                  {msg}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {result?.ok ? (
        <div role="status" className="rounded-card border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {result.message}
        </div>
      ) : null}

      {/* Basics */}
      <section className={cn("rounded-card border bg-warm-white p-5 shadow-soft", hasBasicError ? "border-danger/50 ring-1 ring-danger/20" : "border-hairline")}>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">
          Basics
          {hasBasicError ? <span className="ml-2 text-sm font-normal text-danger">— fix errors below</span> : null}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Product name" required value={form.name} error={fe.name} onChange={(e) => { onNameChange(e.target.value); if (fe.name) setResult(null); }} />
          <Input
            label="Slug"
            hint={fe.slug ? undefined : "Used in the storefront URL."}
            error={fe.slug}
            value={form.slug}
            onChange={(e) => {
              autogenSlug.current = false;
              set("slug", slugify(e.target.value));
              if (fe.slug) setResult(null);
            }}
          />
          <Input label="Product SKU" required value={form.sku} error={fe.sku} onChange={(e) => { set("sku", e.target.value); if (fe.sku) setResult(null); }} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            <Input
              label="Product type"
              hint="e.g. Kurti, Dress"
              value={form.productType}
              onChange={(e) => set("productType", e.target.value)}
            />
          </div>
          <Select label="Category" required value={form.categoryId} error={fe.categoryId} onChange={(e) => { set("categoryId", e.target.value); if (fe.categoryId) setResult(null); }}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Subcategory" value={form.subcategoryId} onChange={(e) => set("subcategoryId", e.target.value)}>
            <option value="">None</option>
            {activeSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-[#22c0d4]"
            />
            Visible in storefront
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="h-4 w-4 accent-[#22c0d4]"
            />
            Featured
          </label>
        </div>
      </section>

      {/* Pricing */}
      <section className={cn("rounded-card border bg-warm-white p-5 shadow-soft", hasPricingError ? "border-danger/50 ring-1 ring-danger/20" : "border-hairline")}>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">
          Pricing
          {hasPricingError ? <span className="ml-2 text-sm font-normal text-danger">— fix errors below</span> : null}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="MRP (₹)"
            required
            type="number"
            min="0"
            step="1"
            value={form.mrp}
            error={fe.mrp}
            onChange={(e) => { handleMrpChange(e.target.value); if (fe.mrp) setResult(null); }}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="99"
              step="1"
              value={discountPct}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder="e.g. 20"
              className="h-11 rounded-card border border-hairline bg-warm-white px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-ayli-blue focus:outline-none"
            />
          </div>
          <Input
            label="Selling price (₹)"
            required
            type="number"
            min="0"
            step="1"
            value={form.sellingPrice}
            error={fe.sellingPrice}
            onChange={(e) => { handleSellingPriceChange(e.target.value); if (fe.sellingPrice) setResult(null); }}
          />
          <Input
            label="Tax rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.taxRate}
            error={fe.taxRate}
            onChange={(e) => { set("taxRate", e.target.value); if (fe.taxRate) setResult(null); }}
          />
          <div className="flex items-end pb-2 text-sm">
            {displayDiscount !== null && displayDiscount > 0 ? (
              <span className="rounded-pill bg-success/10 px-2.5 py-1 font-semibold text-success">
                {displayDiscount}% off
              </span>
            ) : (
              <span className="text-muted">No discount</span>
            )}
          </div>
        </div>
      </section>

      {/* Attributes */}
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">Attributes</h2>
        <p className="mb-4 text-sm text-muted">
          Structured values power the storefront&apos;s filters and search.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Fabric */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Fabric</label>
            <select
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="h-11 rounded-card border border-hairline bg-warm-white px-3 text-[15px] text-ink focus:border-ayli-blue focus:outline-none"
            >
              <option value="">— Select —</option>
              {fabric && !(FABRIC_OPTIONS as readonly string[]).includes(fabric) ? (
                <option value={fabric}>{fabric}</option>
              ) : null}
              {FABRIC_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {/* Pattern */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Pattern</label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="h-11 rounded-card border border-hairline bg-warm-white px-3 text-[15px] text-ink focus:border-ayli-blue focus:outline-none"
            >
              <option value="">— Select —</option>
              {pattern && !(PATTERN_OPTIONS as readonly string[]).includes(pattern) ? (
                <option value={pattern}>{pattern}</option>
              ) : null}
              {PATTERN_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {/* Sleeve */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Sleeve</label>
            <select
              value={sleeveType}
              onChange={(e) => setSleeveType(e.target.value)}
              className="h-11 rounded-card border border-hairline bg-warm-white px-3 text-[15px] text-ink focus:border-ayli-blue focus:outline-none"
            >
              <option value="">— Select —</option>
              {sleeveType && !(SLEEVE_OPTIONS as readonly string[]).includes(sleeveType) ? (
                <option value={sleeveType}>{sleeveType}</option>
              ) : null}
              {SLEEVE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {/* Neck */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Neck</label>
            <select
              value={neckType}
              onChange={(e) => setNeckType(e.target.value)}
              className="h-11 rounded-card border border-hairline bg-warm-white px-3 text-[15px] text-ink focus:border-ayli-blue focus:outline-none"
            >
              <option value="">— Select —</option>
              {neckType && !(NECK_OPTIONS as readonly string[]).includes(neckType) ? (
                <option value={neckType}>{neckType}</option>
              ) : null}
              {NECK_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {/* Length, Fit, Waist, Rise, Occasion, Material, Transparency, Stretchability */}
          {ATTR_DROPDOWNS.map(({ key, label, options }) => {
            const currentValue = attrs[key] || "";
            const hasCustom = currentValue && !(options as readonly string[]).includes(currentValue);
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">{label}</label>
                <select
                  value={currentValue}
                  onChange={(e) => setAttrs((a) => ({ ...a, [key]: e.target.value }))}
                  className="h-11 rounded-card border border-hairline bg-warm-white px-3 text-[15px] text-ink focus:border-ayli-blue focus:outline-none"
                >
                  <option value="">— Select —</option>
                  {hasCustom ? (
                    <option value={currentValue}>{currentValue}</option>
                  ) : null}
                  {options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      {/* Size Chart */}
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Size Chart</h2>
            <p className="mt-1 text-sm text-muted">
              Add measurement columns and rows. All values are editable inline.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={addChartColumn}>
              <Icon name="plus" className="h-4 w-4" />
              Add Column
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={addChartRow}>
              <Icon name="plus" className="h-4 w-4" />
              Add Row
            </Button>
          </div>
        </div>

        {sizeChart.headers.length === 0 && sizeChart.rows.length === 0 ? (
          <div className="rounded-card bg-soft-beige/60 px-4 py-6 text-center text-sm text-muted">
            No size chart yet.{" "}
            <button
              type="button"
              onClick={() => setSizeChart(DEFAULT_SIZE_CHART)}
              className="font-medium text-ayli-blue underline-offset-2 hover:underline"
            >
              Load defaults
            </button>{" "}
            or use the buttons above to add columns and rows.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline">
                  {sizeChart.headers.map((header, colIdx) => (
                    <th key={colIdx} className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <input
                          value={header}
                          onChange={(e) => updateChartHeader(colIdx, e.target.value)}
                          className="h-9 w-full min-w-20 rounded-md border border-hairline bg-soft-beige/60 px-2 text-xs font-semibold uppercase tracking-wide text-ink focus:border-ayli-blue focus:outline-none"
                        />
                        {sizeChart.headers.length > 1 ? (
                          <button
                            type="button"
                            title="Remove column"
                            onClick={() => removeChartColumn(colIdx)}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-danger hover:bg-danger/10"
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </th>
                  ))}
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/70">
                {sizeChart.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-soft-beige/30">
                    {row.map((cell, colIdx) => (
                      <td key={colIdx} className="px-2 py-1.5">
                        <input
                          value={cell}
                          onChange={(e) => updateChartCell(rowIdx, colIdx, e.target.value)}
                          className="h-9 w-full min-w-16 rounded-md border border-hairline bg-warm-white px-2 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        title="Remove row"
                        onClick={() => removeChartRow(rowIdx)}
                        className="grid h-8 w-8 place-items-center rounded-md text-danger hover:bg-danger/10"
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Description */}
      <section className={cn("rounded-card border bg-warm-white p-5 shadow-soft", hasDescriptionError ? "border-danger/50 ring-1 ring-danger/20" : "border-hairline")}>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">Description &amp; care</h2>
        <div className="flex flex-col gap-4">
          <Textarea label="Short description" rows={2} maxLength={500} value={form.shortDescription} error={fe.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          <Textarea label="Full description" rows={5} value={form.description} error={fe.description} onChange={(e) => set("description", e.target.value)} />
          <Textarea label="Wash / care instructions" rows={3} value={form.washCare} error={fe.washCare} onChange={(e) => set("washCare", e.target.value)} />
          <Input label="Model info" hint={fe.modelInfo ? undefined : 'e.g. "Model wears M, 5\' tall"'} error={fe.modelInfo} value={form.modelInfo} onChange={(e) => set("modelInfo", e.target.value)} />
          <Textarea label="Garment measurements" rows={3} value={form.garmentMeasurements} error={fe.garmentMeasurements} onChange={(e) => set("garmentMeasurements", e.target.value)} />
          <Textarea label="Product measurements" rows={3} value={form.productMeasurements} error={fe.productMeasurements} onChange={(e) => set("productMeasurements", e.target.value)} />
          <Input label="Country of origin" value={form.countryOfOrigin} error={fe.countryOfOrigin} onChange={(e) => set("countryOfOrigin", e.target.value)} />
        </div>
      </section>

      {/* Images */}
      <section className={cn("rounded-card border bg-warm-white p-5 shadow-soft", hasImageError ? "border-danger/50 ring-1 ring-danger/20" : "border-hairline")}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Images</h2>
            <p className="mt-1 text-sm text-muted">
              Drag &amp; drop to upload, drag thumbnails to reorder. The first image is the main one
              unless another is marked.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setImages((imgs) => [...imgs, emptyImage()])}>
            <Icon name="plus" className="h-4 w-4" />
            Add by URL
          </Button>
        </div>

        {/* Upload dropzones: 1st Main Image, Next Other Images */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 1. Main Image Upload (1st) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ayli-blue text-xs font-bold text-white shadow-sm">
                  1
                </span>
                <span className="font-semibold text-ink text-sm">Main Image (Upload 1st)</span>
              </div>
              <span className="rounded-pill bg-ayli-blue/10 px-2.5 py-0.5 text-[11px] font-semibold text-ayli-blue">
                Storefront Cover
              </span>
            </div>
            <p className="text-xs text-muted">
              Primary product cover displayed on storefront catalog, search &amp; cards.
            </p>
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload main image (1st)"
              onClick={() => mainFileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") mainFileInputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActiveMain(true);
              }}
              onDragLeave={() => setDragActiveMain(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActiveMain(false);
                if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files, { isMain: true });
              }}
              onPaste={(e) => {
                if (e.clipboardData.files.length) uploadFiles(e.clipboardData.files, { isMain: true });
              }}
              className={cn(
                "group cursor-pointer rounded-card border-2 border-dashed px-4 py-8 text-center transition-all",
                dragActiveMain
                  ? "border-ayli-blue bg-ayli-blue/10 scale-[1.01]"
                  : "border-ayli-blue/50 bg-ayli-blue/[0.03] hover:border-ayli-blue hover:bg-ayli-blue/5",
              )}
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ayli-blue/15 text-ayli-blue transition-transform group-hover:scale-110">
                <Icon name="star" className="h-5 w-5" solid />
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                Drag &amp; drop Main Image here
              </p>
              <p className="mt-1 text-xs text-muted">
                or click to browse · sets as 1st product cover image
              </p>
              <input
                ref={mainFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files, { isMain: true });
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* 2. Other Images Upload (Next) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-xs font-bold text-white shadow-sm">
                  2
                </span>
                <span className="font-semibold text-ink text-sm">Other Images (Upload Next)</span>
              </div>
              <span className="rounded-pill bg-soft-beige px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                Gallery &amp; Angles
              </span>
            </div>
            <p className="text-xs text-muted">
              Add more views: back, sides, model close-ups, fabric texture (multi-select).
            </p>
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload other images (next)"
              onClick={() => otherFileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") otherFileInputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActiveOther(true);
              }}
              onDragLeave={() => setDragActiveOther(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActiveOther(false);
                if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files, { isMain: false });
              }}
              onPaste={(e) => {
                if (e.clipboardData.files.length) uploadFiles(e.clipboardData.files, { isMain: false });
              }}
              className={cn(
                "group cursor-pointer rounded-card border-2 border-dashed px-4 py-8 text-center transition-all",
                dragActiveOther
                  ? "border-charcoal bg-charcoal/10 scale-[1.01]"
                  : "border-hairline bg-soft-beige/40 hover:border-ink/50 hover:bg-soft-beige/70",
              )}
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-soft-beige text-ink/70 transition-transform group-hover:scale-110">
                <Icon name="box" className="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                Drag &amp; drop Other Images here
              </p>
              <p className="mt-1 text-xs text-muted">
                or click to browse · select multiple files at once
              </p>
              <input
                ref={otherFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files, { isMain: false });
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {uploadError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {uploadError}
          </p>
        ) : null}

        {images.length === 0 && uploadQueue.length === 0 ? (
          <p className="mt-4 rounded-card bg-soft-beige/60 px-4 py-3 text-sm text-muted">
            No images yet. Use the upload boxes above, or use{" "}
            <span className="font-medium text-ink">Add by URL</span> to paste a link.
          </p>
        ) : null}

        {/* Uploaded gallery — drag thumbnails to reorder */}
        {images.some((img) => img.url.trim()) || uploadQueue.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images
              .filter((img) => img.url.trim())
              .map((img) => (
                <li
                  key={img.key}
                  draggable
                  onDragStart={(e) => {
                    setDragImageKey(img.key);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    if (dragImageKey != null) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragImageKey != null && dragImageKey !== img.key) {
                      moveImage(dragImageKey, img.key);
                    }
                    setDragImageKey(null);
                  }}
                  className={cn(
                    "group relative aspect-[4/5] overflow-hidden rounded-card border border-hairline bg-soft-beige",
                    dragImageKey === img.key && "opacity-40",
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || "Product image"}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="pointer-events-none object-cover"
                  />
                  <span
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-black/30 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    title="Drag to reorder"
                  >
                    <Icon name="menu" className="h-4 w-4" />
                  </span>
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {img.isMain ? (
                      <span className="rounded-pill bg-ayli-blue px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                        Main
                      </span>
                    ) : null}
                    {img.colour ? (
                      <span className="rounded-pill bg-plum px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                        {img.colour}
                      </span>
                    ) : null}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={img.colour}
                        onChange={(e) => updateImage(img.key, { colour: e.target.value })}
                        aria-label="Image color tone"
                        className="h-8 min-w-0 flex-1 rounded-md border border-white/20 bg-white/90 px-2 text-xs font-medium text-ink focus:border-ayli-blue focus:outline-none"
                      >
                        <option value="">General / All colours</option>
                        {availableColours.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        title={img.isMain ? "Main image" : "Mark as main"}
                        aria-pressed={img.isMain}
                        onClick={() => updateImage(img.key, { isMain: true })}
                        className={cn(
                          "grid h-8 w-8 place-items-center shrink-0 rounded-md transition-colors",
                          img.isMain ? "bg-ayli-blue text-white" : "bg-white/90 text-ink hover:bg-white",
                        )}
                      >
                        <Icon name="star" className="h-4 w-4" solid={img.isMain} />
                      </button>
                      <button
                        type="button"
                        title="Remove image"
                        aria-label="Remove image"
                        onClick={() => setImages((imgs) => imgs.filter((x) => x.key !== img.key))}
                        className="grid h-8 w-8 place-items-center shrink-0 rounded-md bg-white/90 text-ink hover:bg-white transition-colors"
                      >
                        <Icon name="trash" className="h-4 w-4 text-danger" />
                      </button>
                    </div>
                    <input
                      value={img.alt}
                      onChange={(e) => updateImage(img.key, { alt: e.target.value })}
                      placeholder="Alt text (optional)"
                      aria-label="Image alt text"
                      className="h-7 min-w-0 w-full rounded-md border border-white/20 bg-white/90 px-2 text-xs text-ink placeholder:text-muted/70 focus:border-ayli-blue focus:outline-none"
                    />
                  </div>
                </li>
              ))}
            {uploadQueue.map((q) => (
              <li
                key={q.id}
                className="grid aspect-[4/5] place-items-center rounded-card border border-hairline bg-soft-beige"
              >
                <div className="flex flex-col items-center gap-2 text-sm text-muted">
                  <span
                    role="status"
                    className="h-5 w-5 animate-spin rounded-full border-2 border-ayli-blue border-t-transparent"
                  />
                  <span className="max-w-28 truncate text-xs">{q.name}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {/* URL-pasted rows (no thumbnail yet) */}
        {images.some((img) => !img.url.trim()) ? (
          <ul className="mt-4 flex flex-col gap-3">
            {images
              .filter((img) => !img.url.trim())
              .map((img) => (
                <li key={img.key} className="flex flex-wrap items-end gap-3 rounded-card border border-hairline/70 p-3">
                  <Input
                    label="URL"
                    className="max-w-64 min-w-52 flex-1"
                    placeholder="https://…"
                    value={img.url}
                    onChange={(e) => updateImage(img.key, { url: e.target.value })}
                  />
                  <Input
                    label="Alt text"
                    className="max-w-48 min-w-40 flex-1"
                    value={img.alt}
                    onChange={(e) => updateImage(img.key, { alt: e.target.value })}
                  />
                  <Select
                    label="Color tone"
                    className="max-w-40 min-w-32"
                    value={img.colour}
                    onChange={(e) => updateImage(img.key, { colour: e.target.value })}
                  >
                    <option value="">General / All</option>
                    {availableColours.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                  <label className="flex items-center gap-2 pb-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={img.isMain}
                      onChange={(e) => updateImage(img.key, { isMain: e.target.checked })}
                      className="h-4 w-4 accent-[#22c0d4]"
                    />
                    Main
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove image"
                    onClick={() => setImages((imgs) => imgs.filter((x) => x.key !== img.key))}
                  >
                    <Icon name="trash" className="h-4 w-4 text-danger" />
                  </Button>
                </li>
              ))}
          </ul>
        ) : null}
      </section>

      {/* Variants */}
      <section className={cn("rounded-card border bg-warm-white p-5 shadow-soft", hasVariantError ? "border-danger/50 ring-1 ring-danger/20" : "border-hairline")}>
        {hasVariantError && fe["variants"] ? (
          <p className="mb-3 rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">{fe["variants"]}</p>
        ) : null}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Variants{" "}
            <span className="text-sm font-normal text-muted">
              ({variants.length} colour × size · {totalUnits} units)
            </span>
          </h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">Set all stock</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="99999"
                  value={allStockValue}
                  onChange={(e) => setAllStockValue(e.target.value)}
                  placeholder="Quantity"
                  aria-label="Set stock for all variants"
                  className="h-9 w-28 rounded-card border border-hairline bg-warm-white px-3 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                />
                <Button type="button" variant="secondary" size="sm" onClick={applyStockToAll}>
                  Apply
                </Button>
              </div>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
              <Icon name="plus" className="h-4 w-4" />
              Add variant
            </Button>
          </div>
        </div>

        <div className="mb-4 rounded-card bg-soft-beige/60 p-4">
          <p className="mb-3 text-sm font-medium text-ink">
            Build colour × sizes from the available options
          </p>

          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Colours</p>
          <div className="flex flex-wrap gap-2">
            {COLOUR_SWATCHES.map((swatch) => {
              const selected = selectedColours.includes(swatch.name);
              return (
                <button
                  key={swatch.name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSelectedColour(swatch.name)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors",
                    selected
                      ? "border-ayli-blue bg-ayli-blue/10 text-ayli-blue"
                      : "border-hairline bg-warm-white text-ink hover:border-ink/20",
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-ink/10"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  {swatch.name}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Input
              label="Custom colour name"
              className="max-w-44"
              placeholder="e.g. Honey Gold"
              value={customColour.name}
              onChange={(e) => setCustomColour((c) => ({ ...c, name: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Pick</span>
              <input
                type="color"
                aria-label="Custom colour"
                value={/^#[0-9a-f]{6}$/i.test(customColour.hex) ? customColour.hex : "#8B6F5E"}
                onChange={(e) => setCustomColour((c) => ({ ...c, hex: e.target.value }))}
                className="h-12 w-14 cursor-pointer rounded-card border border-hairline bg-warm-white p-1"
              />
            </div>
            <Input
              label="Hex code"
              className="max-w-32"
              value={customColour.hex}
              onChange={(e) => setCustomColour((c) => ({ ...c, hex: e.target.value }))}
            />
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-muted">Sizes</p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_SIZES.map((size) => {
              const selected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSelectedSize(size)}
                  className={cn(
                    "min-w-11 rounded-card border px-3 py-1.5 text-sm font-medium transition-colors",
                    selected
                      ? "border-ayli-blue bg-ayli-blue/10 text-ink"
                      : "border-hairline bg-warm-white text-ink hover:border-ink/20",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Input
              label="Extra sizes (comma separated)"
              className="max-w-56"
              placeholder="XXL, 7XL"
              value={customSizes}
              onChange={(e) => setCustomSizes(e.target.value)}
            />
            <Input
              label="Default stock per variant"
              type="number"
              min="0"
              className="max-w-28"
              value={batchStock}
              onChange={(e) => setBatchStock(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={selectedColours.length === 0 && !customColour.name.trim()}
              onClick={addBuiltVariants}
            >
              Generate
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs uppercase tracking-widest text-muted">
                <th className="px-2 py-2 font-semibold">Colour</th>
                <th className="px-2 py-2 font-semibold">Hex</th>
                <th className="px-2 py-2 font-semibold">Size</th>
                <th className="px-2 py-2 font-semibold">SKU</th>
                <th className="px-2 py-2 font-semibold">Price ₹</th>
                <th className="px-2 py-2 font-semibold">Stock</th>
                <th className="px-2 py-2 font-semibold">Active</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/70">
              {variants.map((v, vIdx) => {
                // Check if this specific variant row has errors
                const vPrefix = `variants.${vIdx}`;
                const vColourErr = fe[`${vPrefix}.colour`];
                const vSizeErr = fe[`${vPrefix}.size`];
                const vSkuErr = fe[`${vPrefix}.sku`];
                const vStockErr = fe[`${vPrefix}.stock`];
                const rowHasError = !!(vColourErr || vSizeErr || vSkuErr || vStockErr);
                return (
                  <tr key={v.key} className={rowHasError ? "bg-danger/5" : undefined}>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                        <input
                          value={v.colour}
                          onChange={(e) => updateVariant(v.key, { colour: e.target.value })}
                          placeholder="Dusty Brown"
                          aria-invalid={!!vColourErr}
                          className={cn(
                            "h-10 w-full min-w-28 rounded-card border bg-warm-white px-3 text-sm text-ink focus:outline-none",
                            vColourErr ? "border-danger focus:border-danger" : "border-hairline focus:border-ayli-blue"
                          )}
                        />
                        {vColourErr ? <p className="text-xs text-danger">{vColourErr}</p> : null}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={v.colourHex}
                        onChange={(e) => updateVariant(v.key, { colourHex: e.target.value })}
                        placeholder="#8B6F5E"
                        className="h-10 w-24 rounded-card border border-hairline bg-warm-white px-3 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                        <input
                          value={v.size}
                          onChange={(e) => updateVariant(v.key, { size: e.target.value })}
                          placeholder="M"
                          aria-invalid={!!vSizeErr}
                          className={cn(
                            "h-10 w-16 rounded-card border bg-warm-white px-3 text-sm text-ink focus:outline-none",
                            vSizeErr ? "border-danger focus:border-danger" : "border-hairline focus:border-ayli-blue"
                          )}
                        />
                        {vSizeErr ? <p className="text-xs text-danger">{vSizeErr}</p> : null}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                        <input
                          value={v.sku}
                          onChange={(e) => updateVariant(v.key, { sku: e.target.value })}
                          placeholder="AYLI-…-S"
                          aria-invalid={!!vSkuErr}
                          className={cn(
                            "h-10 w-full min-w-32 rounded-card border bg-warm-white px-3 text-sm text-ink focus:outline-none",
                            vSkuErr ? "border-danger focus:border-danger" : "border-hairline focus:border-ayli-blue"
                          )}
                        />
                        {vSkuErr ? <p className="text-xs text-danger">{vSkuErr}</p> : null}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={v.price}
                        onChange={(e) => updateVariant(v.key, { price: e.target.value })}
                        placeholder="Optional"
                        className="h-10 w-24 rounded-card border border-hairline bg-warm-white px-3 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => updateVariant(v.key, { stock: e.target.value })}
                          aria-invalid={!!vStockErr}
                          className={cn(
                            "h-10 w-20 rounded-card border bg-warm-white px-3 text-sm text-ink focus:outline-none",
                            vStockErr ? "border-danger focus:border-danger" : "border-hairline focus:border-ayli-blue"
                          )}
                        />
                        {vStockErr ? <p className="text-xs text-danger">{vStockErr}</p> : null}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={v.active}
                        onChange={(e) => updateVariant(v.key, { active: e.target.checked })}
                        className="h-4 w-4 accent-[#22c0d4]"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Remove variant"
                        onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))}
                      >
                        <Icon name="trash" className="h-4 w-4 text-danger" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {variants.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No variants yet — add one above.</p>
        ) : null}
      </section>

      {/* Collections */}
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">Collections</h2>
        {collections.length === 0 ? (
          <p className="text-sm text-muted">No collections defined yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {collections.map((c) => {
              const checked = collectionIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={
                    checked
                      ? "flex cursor-pointer items-center gap-2 rounded-pill border border-ayli-blue bg-ayli-blue/10 px-4 py-2 text-sm font-medium text-ayli-blue"
                      : "flex cursor-pointer items-center gap-2 rounded-pill border border-hairline bg-warm-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/20"
                  }
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={(e) =>
                      setCollectionIds((ids) =>
                        e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id),
                      )
                    }
                  />
                  {c.name}
                </label>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
          className="sm:mr-auto"
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={pending} disabled={uploadQueue.length > 0}>
          {mode === "create" ? "Create product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}