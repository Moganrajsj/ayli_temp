"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction } from "@/actions/admin.action";
import type { AdminCategoryOption, AdminCollectionOption, AdminProductDetail } from "@/lib/admin";
import type { AdminActionResult, AdminProductInput } from "@/lib/validation";
import { COLOUR_SWATCHES, PRODUCT_SIZES } from "@/config/product-options";
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
  isMain: boolean;
}

let rowId = 0;
const nextRow = () => ++rowId;

const FIELD_LABELS: Record<string, string> = {
  fabric: "Fabric",
  pattern: "Pattern",
  printType: "Print type",
  sleeveType: "Sleeve",
  neckType: "Neck",
  length: "Length",
  fit: "Fit",
  waist: "Waist",
  rise: "Rise",
  occasion: "Occasion",
  material: "Material",
  transparency: "Transparency",
  stretchability: "Stretchability",
};

const FIELD_KEYS = Object.keys(FIELD_LABELS);

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
  return { key: nextRow(), url: "", alt: "", isMain: false };
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
          costPrice: initial.costPrice != null ? String(initial.costPrice) : "",
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
          costPrice: "",
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

  const [attrs, setAttrs] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const key of FIELD_KEYS) base[key] = "";
    if (initial) {
      for (const key of FIELD_KEYS) base[key] = String((initial as unknown as Record<string, unknown>)[key] ?? "");
    }
    return base;
  });

  const [images, setImages] = useState<ImageRow[]>(() =>
    initial && initial.images.length > 0
      ? initial.images.map((img) => ({ key: nextRow(), url: img.url, alt: img.alt ?? "", isMain: img.isMain }))
      : [emptyImage()],
  );

  const [uploadQueue, setUploadQueue] = useState<{ id: number; name: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragImageKey, setDragImageKey] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const discount = useMemo(() => {
    const mrp = Number(form.mrp);
    const sp = Number(form.sellingPrice);
    if (!mrp || !sp || sp > mrp) return null;
    return Math.round(((mrp - sp) / mrp) * 100);
  }, [form.mrp, form.sellingPrice]);

  const totalUnits = useMemo(
    () => variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    [variants],
  );

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

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setUploadError(null);
    const ids = files.map(() => nextRow());
    setUploadQueue((q) => [
      ...q,
      ...files.map((f, i) => ({ id: ids[i], name: f.name })),
    ]);
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
          const uploaded = data.files[0];
          setImages((imgs) => [
            ...imgs,
            { key: ids[i], url: uploaded.url, alt: "", isMain: imgs.length === 0 },
          ]);
        } else {
          setUploadError((e) => e ?? data.error ?? `"${files[i].name}" could not be uploaded.`);
        }
      } catch {
        setUploadError((e) => e ?? `"${files[i].name}" could not be uploaded.`);
      } finally {
        setUploadQueue((q) => q.filter((x) => x.id !== ids[i]));
      }
    }
  }

  function moveImage(fromKey: number, toKey: number) {
    setImages((imgs) => {
      const from = imgs.findIndex((img) => img.key === fromKey);
      const to = imgs.findIndex((img) => img.key === toKey);
      if (from < 0 || to < 0 || from === to) return imgs;
      const reordered = [...imgs];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      return reordered;
    });
  }

  function updateVariant(key: number, patch: Partial<VariantRow>) {
    setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function updateImage(key: number, patch: Partial<ImageRow>) {
    setImages((imgs) =>
      imgs.map((img) => {
        if (img.key !== key) return img;
        const next = { ...img, ...patch };
        if (patch.isMain) {
          return next;
        }
        return next;
      }),
    );
    if (patch.isMain) {
      setImages((imgs) =>
        imgs.map((img) => (img.key === key ? { ...img, isMain: true } : { ...img, isMain: false })),
      );
    }
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
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      taxRate: Number(form.taxRate || 0),
      countryOfOrigin: form.countryOfOrigin.trim() || "India",
      sizeChartUrl: form.sizeChartUrl.trim() || null,
      modelInfo: form.modelInfo.trim() || null,
      garmentMeasurements: form.garmentMeasurements.trim() || null,
      productMeasurements: form.productMeasurements.trim() || null,
      washCare: form.washCare.trim() || null,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      fabric: attrs.fabric.trim() || null,
      pattern: attrs.pattern.trim() || null,
      printType: attrs.printType.trim() || null,
      sleeveType: attrs.sleeveType.trim() || null,
      neckType: attrs.neckType.trim() || null,
      length: attrs.length.trim() || null,
      fit: attrs.fit.trim() || null,
      waist: attrs.waist.trim() || null,
      rise: attrs.rise.trim() || null,
      occasion: attrs.occasion.trim() || null,
      material: attrs.material.trim() || null,
      transparency: attrs.transparency.trim() || null,
      stretchability: attrs.stretchability.trim() || null,
      images: images.map((img, i) => ({
        url: img.url.trim(),
        alt: img.alt.trim() || "",
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
    }
  }

  const errorText = result && !result.ok ? (result.message ?? "Please review the highlighted fields.") : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {errorText ? (
        <div role="alert" className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {errorText}
        </div>
      ) : null}
      {result?.ok ? (
        <div role="status" className="rounded-card border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {result.message}
        </div>
      ) : null}

      {/* Basics */}
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Product name" required value={form.name} onChange={(e) => onNameChange(e.target.value)} />
          <Input
            label="Slug"
            hint="Used in the storefront URL."
            value={form.slug}
            onChange={(e) => {
              autogenSlug.current = false;
              set("slug", slugify(e.target.value));
            }}
          />
          <Input label="Product SKU" required value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            <Input
              label="Product type"
              hint="e.g. Kurti, Dress"
              value={form.productType}
              onChange={(e) => set("productType", e.target.value)}
            />
          </div>
          <Select label="Category" required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
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
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="MRP (₹)" required type="number" min="0" step="1" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} />
          <Input label="Selling price (₹)" required type="number" min="0" step="1" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
          <Input label="Cost price (₹)" type="number" min="0" step="1" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
          <Input label="Tax rate (%)" type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} />
          <div className="flex items-end pb-2 text-sm">
            {discount !== null && discount > 0 ? (
              <span className="rounded-pill bg-success/10 px-2.5 py-1 font-semibold text-success">
                {discount}% off
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
          {FIELD_KEYS.map((key) => (
            <Input
              key={key}
              label={FIELD_LABELS[key]}
              value={attrs[key]}
              onChange={(e) => setAttrs((a) => ({ ...a, [key]: e.target.value }))}
            />
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">Description & care</h2>
        <div className="flex flex-col gap-4">
          <Textarea label="Short description" rows={2} maxLength={500} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          <Textarea label="Full description" rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
          <Textarea label="Wash / care instructions" rows={3} value={form.washCare} onChange={(e) => set("washCare", e.target.value)} />
          <Input label="Size chart URL" value={form.sizeChartUrl} onChange={(e) => set("sizeChartUrl", e.target.value)} />
          <Input label="Model info" hint='e.g. "Model wears M, 5 tall"' value={form.modelInfo} onChange={(e) => set("modelInfo", e.target.value)} />
          <Textarea label="Garment measurements" rows={3} value={form.garmentMeasurements} onChange={(e) => set("garmentMeasurements", e.target.value)} />
          <Textarea label="Product measurements" rows={3} value={form.productMeasurements} onChange={(e) => set("productMeasurements", e.target.value)} />
          <Input label="Country of origin" value={form.countryOfOrigin} onChange={(e) => set("countryOfOrigin", e.target.value)} />
        </div>
      </section>

      {/* Images */}
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
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

        <div
          role="button"
          tabIndex={0}
          aria-label="Upload product images"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
          }}
          onPaste={(e) => {
            if (e.clipboardData.files.length) uploadFiles(e.clipboardData.files);
          }}
          className={cn(
            "cursor-pointer rounded-card border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragActive
              ? "border-ayli-blue bg-ayli-blue/5"
              : "border-hairline bg-soft-beige/40 hover:border-ayli-blue/50",
          )}
        >
          <Icon name="box" className="mx-auto h-8 w-8 text-ayli-blue/50" />
          <p className="mt-2 font-medium text-ink">Drag &amp; drop images here</p>
          <p className="mt-1 text-sm text-muted">
            or click to browse · paste from clipboard · JPG, PNG, WebP or GIF up to 8 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {uploadError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {uploadError}
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
                  {img.isMain ? (
                    <span className="absolute left-2 top-2 rounded-pill bg-ayli-blue px-2 py-0.5 text-[11px] font-semibold text-white">
                      Main
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <input
                      value={img.alt}
                      onChange={(e) => updateImage(img.key, { alt: e.target.value })}
                      placeholder="Alt text"
                      aria-label="Image alt text"
                      className="h-8 min-w-0 flex-1 rounded-md border border-white/20 bg-white/90 px-2 text-xs text-ink placeholder:text-muted/70 focus:border-ayli-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      title={img.isMain ? "Main image" : "Mark as main"}
                      aria-pressed={img.isMain}
                      onClick={() => updateImage(img.key, { isMain: true })}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-md",
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
                      className="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-ink hover:bg-white"
                    >
                      <Icon name="trash" className="h-4 w-4 text-danger" />
                    </button>
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
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
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
              {variants.map((v) => (
                <tr key={v.key}>
                  <td className="px-2 py-2">
                    <input
                      value={v.colour}
                      onChange={(e) => updateVariant(v.key, { colour: e.target.value })}
                      placeholder="Dusty Brown"
                      className="h-10 w-full min-w-28 rounded-card border border-hairline bg-warm-white px-3 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                    />
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
                    <input
                      value={v.size}
                      onChange={(e) => updateVariant(v.key, { size: e.target.value })}
                      placeholder="M"
                      className="h-10 w-16 rounded-card border border-hairline bg-warm-white px-3 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={v.sku}
                      onChange={(e) => updateVariant(v.key, { sku: e.target.value })}
                      placeholder="AYLI-…-S"
                      className="h-10 w-full min-w-32 rounded-card border border-hairline bg-warm-white px-3 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                    />
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
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => updateVariant(v.key, { stock: e.target.value })}
                      className="h-10 w-20 rounded-card border border-hairline bg-warm-white px-3 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                    />
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
              ))}
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
        <Button type="submit" isLoading={pending}>
          {mode === "create" ? "Create product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}