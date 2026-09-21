"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";
import {
  saveHomepageSectionAction,
  toggleCategoryHomepageAction,
  toggleProductHomepageAction,
  reorderHomepageSectionsAction,
} from "@/actions/homepage.action";
import type {
  AdminCategoryWithProducts,
  HomepageCategorySectionConfig,
} from "@/lib/homepage-config";

interface HomepageManagerProps {
  initialCategories: AdminCategoryWithProducts[];
  initialSections: HomepageCategorySectionConfig[];
}

export function HomepageManager({
  initialCategories,
  initialSections,
}: HomepageManagerProps) {
  const [sections, setSections] = useState(initialSections);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    sections[0]?.categoryId ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Map category ID to its config
  const sectionMap = new Map(sections.map((s) => [s.categoryId, s]));

  // Sort categories by section sortOrder
  const sortedCategories = [...initialCategories].sort((a, b) => {
    const orderA = sectionMap.get(a.id)?.sortOrder ?? 999;
    const orderB = sectionMap.get(b.id)?.sortOrder ?? 999;
    return orderA - orderB;
  });

  function showMessage(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  // Toggle category section enabled/disabled on homepage
  function handleToggleCategory(categoryId: string, currentEnabled: boolean) {
    const next = !currentEnabled;
    setSections((prev) =>
      prev.map((s) => (s.categoryId === categoryId ? { ...s, enabled: next } : s))
    );

    startTransition(async () => {
      const res = await toggleCategoryHomepageAction(categoryId, next);
      if (res.ok) {
        showMessage("success", res.message || "Updated homepage category.");
      } else {
        showMessage("error", res.message || "Failed to update category.");
      }
    });
  }

  // Toggle single product display in a category
  function handleToggleProduct(
    productId: string,
    categoryId: string,
    isCurrentlySelected: boolean
  ) {
    const nextSelected = !isCurrentlySelected;

    setSections((prev) =>
      prev.map((s) => {
        if (s.categoryId !== categoryId) return s;
        const currentIds = new Set(s.productIds || []);
        if (nextSelected) {
          currentIds.add(productId);
        } else {
          currentIds.delete(productId);
        }
        return { ...s, productIds: Array.from(currentIds) };
      })
    );

    startTransition(async () => {
      const res = await toggleProductHomepageAction(
        productId,
        categoryId,
        nextSelected
      );
      if (res.ok) {
        showMessage("success", res.message || "Updated product display.");
      } else {
        showMessage("error", res.message || "Failed to update product.");
      }
    });
  }

  // Update section text fields (title, eyebrow, subtitle) immutably
  function handleSectionFieldChange(
    categoryId: string,
    field: "eyebrow" | "title" | "subtitle",
    value: string
  ) {
    setSections((prev) =>
      prev.map((s) =>
        s.categoryId === categoryId ? { ...s, [field]: value } : s
      )
    );
  }

  // Save text settings (title, eyebrow, subtitle)
  function handleSaveSection(sec: HomepageCategorySectionConfig) {
    startTransition(async () => {
      const res = await saveHomepageSectionAction(sec);
      if (res.ok) {
        showMessage("success", res.message || "Section saved.");
      } else {
        showMessage("error", res.message || "Failed to save section.");
      }
    });
  }

  // Quick select helpers
  function handleQuickSelect(
    categoryId: string,
    mode: "all" | "none" | "top6"
  ) {
    const cat = initialCategories.find((c) => c.id === categoryId);
    if (!cat) return;

    let targetIds: string[] = [];
    if (mode === "all") {
      targetIds = cat.products.map((p) => p.id);
    } else if (mode === "top6") {
      targetIds = cat.products.slice(0, 6).map((p) => p.id);
    }

    const currentSec = sectionMap.get(categoryId) || {
      categoryId: cat.id,
      categorySlug: cat.slug,
      title: cat.name,
      eyebrow: "Studio Collection",
      subtitle: cat.description ?? "",
      enabled: true,
      sortOrder: 0,
      productIds: [],
    };

    const updatedSec = { ...currentSec, productIds: targetIds };

    setSections((prev) =>
      prev.map((s) => (s.categoryId === categoryId ? updatedSec : s))
    );

    startTransition(async () => {
      const res = await saveHomepageSectionAction(updatedSec);
      if (res.ok) {
        showMessage("success", `Updated selection for ${cat.name}.`);
      } else {
        showMessage("error", "Failed to update selection.");
      }
    });
  }

  // Move category section up or down
  function handleMove(categoryId: string, direction: "up" | "down") {
    const currentIndex = sortedCategories.findIndex((c) => c.id === categoryId);
    if (currentIndex < 0) return;
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const newOrder = [...sortedCategories];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    const orderedIds = newOrder.map((c) => c.id);

    setSections((prev) =>
      prev.map((s) => {
        const idx = orderedIds.indexOf(s.categoryId);
        return idx >= 0 ? { ...s, sortOrder: idx } : s;
      })
    );

    startTransition(async () => {
      const res = await reorderHomepageSectionsAction(orderedIds);
      if (res.ok) {
        showMessage("success", "Category order updated.");
      } else {
        showMessage("error", "Failed to reorder categories.");
      }
    });
  }

  const totalActive = sections.filter((s) => s.enabled).length;
  const totalFeaturedProducts = sections
    .filter((s) => s.enabled)
    .reduce((acc, s) => acc + (s.productIds?.length || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-card px-4 py-3 text-sm shadow-sm transition-all ${
            feedback.type === "success"
              ? "border border-success/30 bg-success/10 text-success"
              : "border border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Active Homepage Sections
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">
              {totalActive}
            </span>
            <span className="text-xs text-muted">
              of {initialCategories.length} categories
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Displaying live on the storefront homepage
          </p>
        </div>

        <div className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Featured Products on Home
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-plum">
              {totalFeaturedProducts}
            </span>
            <span className="text-xs text-muted">custom picked products</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Organized into category strips
          </p>
        </div>

        <div className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Storefront Preview
            </p>
            <p className="mt-1 text-xs text-muted">
              Check how customers see the product strips on mobile & desktop
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-pill bg-ink px-4 py-2 text-xs font-medium text-warm-white transition-colors hover:bg-black"
          >
            <span>Preview Homepage</span>
            <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Categories List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Category Showcase Strips
          </h2>
          <span className="text-xs text-muted">
            Use arrows to reorder • Toggle to enable or customize products
          </span>
        </div>

        {sortedCategories.map((cat, index) => {
          const sec = sectionMap.get(cat.id) || {
            categoryId: cat.id,
            categorySlug: cat.slug,
            title: cat.name,
            eyebrow: "Studio Collection",
            subtitle: cat.description ?? "",
            enabled: false,
            sortOrder: index,
            productIds: [],
          };

          const isExpanded = expandedCategoryId === cat.id;
          const selectedProductIds = new Set(sec.productIds || []);
          const selectedCount = cat.products.filter((p) =>
            selectedProductIds.has(p.id)
          ).length;

          // Filter products inside category
          const visibleProducts = cat.products.filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.sku.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <div
              key={cat.id}
              className={`rounded-card border transition-all ${
                sec.enabled
                  ? "border-hairline bg-warm-white shadow-soft"
                  : "border-hairline/60 bg-warm-white/60 opacity-80"
              }`}
            >
              {/* Category Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Up / Down arrows */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0 || isPending}
                      onClick={() => handleMove(cat.id, "up")}
                      className="rounded p-1 text-muted hover:bg-soft-beige hover:text-ink disabled:opacity-25"
                      title="Move Up"
                    >
                      <Icon name="chevron-left" className="h-3.5 w-3.5 rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={
                        index === sortedCategories.length - 1 || isPending
                      }
                      onClick={() => handleMove(cat.id, "down")}
                      className="rounded p-1 text-muted hover:bg-soft-beige hover:text-ink disabled:opacity-25"
                      title="Move Down"
                    >
                      <Icon name="chevron-left" className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base font-semibold text-ink truncate">
                        {sec.title || cat.name}
                      </p>
                      {sec.enabled ? (
                        <span className="rounded-pill bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                          Live on Home
                        </span>
                      ) : (
                        <span className="rounded-pill bg-soft-beige px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">
                      /{cat.slug} • {selectedCount} of {cat.products.length} products displayed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Toggle On/Off */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-medium text-ink hidden sm:inline">
                      {sec.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sec.enabled}
                      disabled={isPending}
                      onClick={() => handleToggleCategory(cat.id, sec.enabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sec.enabled ? "bg-plum" : "bg-soft-beige"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          sec.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>

                  {/* Expand / Collapse Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategoryId(isExpanded ? null : cat.id)
                    }
                    className="flex items-center gap-1.5 rounded-pill border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-soft-beige transition-colors"
                  >
                    <span>{isExpanded ? "Done" : "Customize Products"}</span>
                    <Icon
                      name="chevron-left"
                      className={`h-3 w-3 transition-transform ${
                        isExpanded ? "rotate-90" : "-rotate-90"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded Customization Panel */}
              {isExpanded && (
                <div className="border-t border-hairline bg-soft-beige/20 p-4 sm:p-6 flex flex-col gap-6">
                  {/* Section Title & Eyebrow Config */}
                  <div className="rounded-card border border-hairline bg-warm-white p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                      Section Display Header
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-ink block mb-1">
                          Section Eyebrow (e.g. Studio Favorites)
                        </label>
                        <input
                          type="text"
                          defaultValue={sec.eyebrow ?? "Studio Collection"}
                          onChange={(e) => {
                            handleSectionFieldChange(
                              cat.id,
                              "eyebrow",
                              e.target.value
                            );
                          }}
                          className="w-full rounded-card border border-hairline bg-white px-3 py-2 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-ink block mb-1">
                          Display Title (e.g. Kurtis & Tops)
                        </label>
                        <input
                          type="text"
                          defaultValue={sec.title || cat.name}
                          onChange={(e) => {
                            handleSectionFieldChange(
                              cat.id,
                              "title",
                              e.target.value
                            );
                          }}
                          className="w-full rounded-card border border-hairline bg-white px-3 py-2 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-ink block mb-1">
                          Tagline / Subtitle (Optional)
                        </label>
                        <input
                          type="text"
                          defaultValue={sec.subtitle ?? ""}
                          onChange={(e) => {
                            handleSectionFieldChange(
                              cat.id,
                              "subtitle",
                              e.target.value
                            );
                          }}
                          placeholder="Brief editorial description..."
                          className="w-full rounded-card border border-hairline bg-white px-3 py-2 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSaveSection(sec)}
                        className="rounded-pill bg-ink px-4 py-1.5 text-xs font-medium text-warm-white hover:bg-black transition-colors"
                      >
                        Save Header Text
                      </button>
                    </div>
                  </div>

                  {/* Product Picker */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-display text-sm font-semibold text-ink">
                          Select Products for this Showcase Strip
                        </h3>
                        <p className="text-xs text-muted">
                          Click any product card to add or remove it from the homepage display.
                        </p>
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleQuickSelect(cat.id, "top6")}
                          className="rounded-pill border border-hairline bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-soft-beige"
                        >
                          Pick Top 6
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickSelect(cat.id, "all")}
                          className="rounded-pill border border-hairline bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-soft-beige"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickSelect(cat.id, "none")}
                          className="rounded-pill border border-hairline bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-soft-beige"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Search inside category */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search products in this category by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full sm:w-80 rounded-card border border-hairline bg-white px-3.5 text-xs text-ink placeholder:text-muted focus:border-ayli-blue focus:outline-none"
                      />
                    </div>

                    {/* Product Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {visibleProducts.map((p) => {
                        const isSelected = selectedProductIds.has(p.id);

                        return (
                          <div
                            key={p.id}
                            onClick={() =>
                              handleToggleProduct(p.id, cat.id, isSelected)
                            }
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-plum bg-white ring-2 ring-plum/20 shadow-soft"
                                : "border-hairline bg-white/70 hover:border-hairline hover:bg-white"
                            }`}
                          >
                            {/* Product Thumbnail */}
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-soft-beige mb-2">
                              {p.image ? (
                                <Image
                                  src={p.image}
                                  alt={p.name}
                                  fill
                                  sizes="160px"
                                  className="object-cover object-top"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-rose-mist text-ayli-peach">
                                  ✦
                                </div>
                              )}

                              {/* Selected Status Badge */}
                              <div className="absolute top-1.5 right-1.5">
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-full shadow-xs text-xs font-bold transition-all ${
                                    isSelected
                                      ? "bg-plum text-white scale-105"
                                      : "bg-white/90 text-muted hover:text-ink"
                                  }`}
                                >
                                  {isSelected ? "✓" : "+"}
                                </span>
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-xs font-medium text-ink leading-tight">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-muted truncate mt-0.5">
                                {p.sku}
                              </p>
                              <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-xs font-bold text-ink">
                                  {formatINR(p.sellingPrice)}
                                </span>
                                {p.mrp > p.sellingPrice && (
                                  <span className="text-[10px] text-muted line-through">
                                    {formatINR(p.mrp)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Active pill at bottom of card */}
                            <div className="mt-2 pt-1.5 border-t border-hairline/60 text-center">
                              <span
                                className={`text-[10px] font-semibold uppercase tracking-wider ${
                                  isSelected
                                    ? "text-plum"
                                    : "text-muted group-hover:text-ink"
                                }`}
                              >
                                {isSelected ? "On Homepage" : "Click to Add"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {visibleProducts.length === 0 && (
                      <p className="rounded-card border border-dashed border-hairline p-8 text-center text-xs text-muted">
                        No products match your search in this category.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
