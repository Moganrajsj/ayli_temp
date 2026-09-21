"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { SerializedProductCard } from "@/lib/catalog";
import { formatINR } from "@/lib/utils";

interface NewArrivalCardProps {
  product: SerializedProductCard;
  priority?: boolean;
}

function NewArrivalCard({ product, priority = false }: NewArrivalCardProps) {
  const [wished, setWished] = useState(false);
  const [popKey, setPopKey] = useState(0);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex-shrink-0 w-[44vw] sm:w-[32vw] md:w-[22vw] lg:w-[18vw] xl:w-[15vw] focus:outline-none"
      aria-label={product.name}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-soft-beige">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 44vw, (max-width: 1024px) 32vw, 18vw"
            className="object-cover object-top animate-fade-in transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-rose-mist">
            <span className="text-2xl text-ayli-peach/40">✦</span>
          </div>
        )}

        {/* NEW badge */}
        <span className="absolute left-2 top-2 rounded-sm bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-plum uppercase shadow-sm">
          NEW
        </span>

        {/* Discount badge */}
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-8 mt-0.5 rounded-sm bg-ayli-peach px-1.5 py-0.5 text-[10px] font-bold text-white uppercase shadow-sm">
            {product.discountPercent}% off
          </span>
        )}

        {/* Wishlist heart button */}
        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWished((v) => !v);
            setPopKey((k) => k + 1);
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ayli-peach"
        >
          <svg
            key={`${String(wished)}-${popKey}`}
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-colors duration-200 ${
              wished ? "fill-ayli-peach stroke-ayli-peach" : "fill-none stroke-ink/60"
            } ${wished ? "animate-heart-pop" : ""}`}
            strokeWidth={1.8}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Quick shop pill — shows on hover */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 px-2 pb-2">
          <span className="block w-full rounded-full bg-white/90 backdrop-blur-sm py-1.5 text-center text-[11px] font-medium tracking-wide text-ink shadow-soft">
            Quick Shop
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className="line-clamp-1 text-[12px] font-medium text-ink leading-snug">
          {product.name}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[13px] font-bold text-ink">
            {formatINR(product.price)}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-[11px] text-muted line-through">
              {formatINR(product.mrp)}
            </span>
          )}
        </div>
        {product.colours > 1 && (
          <p className="mt-0.5 text-[11px] text-muted">
            +{product.colours - 1} more colour{product.colours - 1 > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}

const TABS = [
  { label: "All", value: "all" },
  { label: "Kurta Sets", value: "kurta" },
  { label: "Co-ords", value: "coord" },
  { label: "Dresses", value: "dress" },
];

interface NewArrivalsSectionProps {
  products: SerializedProductCard[];
}

export function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  const [activeTab, setActiveTab] = useState("all");

  // Simple client-side filter by name keyword (real filtering would be server-side)
  const filtered =
    activeTab === "all"
      ? products
      : products.filter((p) => {
          const name = p.name.toLowerCase();
          if (activeTab === "kurta") return name.includes("kurta");
          if (activeTab === "coord") return name.includes("coord") || name.includes("co-ord") || name.includes("set");
          if (activeTab === "dress") return name.includes("dress");
          return true;
        });

  // If filtered result is empty (no matching products), fall back to all
  const visible = filtered.length > 0 ? filtered : products;

  return (
    <section className="py-10 sm:py-14 bg-warm-white">
      {/* Section header */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.35em] uppercase text-ayli-peach block mb-1">
              Fresh from the studio
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light italic text-ink leading-tight">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/collection/new-arrivals"
            className="text-[12px] font-medium text-plum underline underline-offset-2 decoration-plum/30 hover:decoration-plum transition-all flex items-center gap-1"
          >
            View all
            <span className="text-ayli-peach">→</span>
          </Link>
        </div>

        {/* Tab pills */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 mb-5 sm:mb-7">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                "flex-shrink-0 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ayli-peach",
                activeTab === tab.value
                  ? "border-ink bg-ink text-white"
                  : "border-hairline bg-white text-muted hover:border-ayli-peach/60 hover:text-ink",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal scroll product strip */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
        {visible.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-blush/60 text-sm text-muted">
            No new arrivals yet — check back soon.
          </div>
        ) : (
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:overflow-visible sm:gap-4 sm:pb-0">
            {visible.map((product, i) => (
              <NewArrivalCard
                key={product.slug}
                product={product}
                priority={i < 3}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 flex justify-center px-4">
        <Link
          href="/collection/new-arrivals"
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-white px-8 py-2.5 text-[13px] font-medium text-ink shadow-xs transition-all duration-200 hover:border-ayli-peach hover:text-plum hover:shadow-soft"
        >
          View all new arrivals
          <span className="text-ayli-peach">→</span>
        </Link>
      </div>
    </section>
  );
}
