"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { SerializedProductCard } from "@/lib/catalog";
import { formatINR } from "@/lib/utils";

interface CategoryProductCardProps {
  product: SerializedProductCard;
  priority?: boolean;
}

function CategoryProductCard({ product, priority = false }: CategoryProductCardProps) {
  const [wished, setWished] = useState(false);
  const [popKey, setPopKey] = useState(0);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex-shrink-0 w-[44vw] sm:w-[32vw] md:w-[22vw] lg:w-[18vw] xl:w-[15vw] focus:outline-none"
      aria-label={product.name}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-soft-beige shadow-xs">
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

        {/* Discount badge */}
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-sm bg-ayli-peach px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-xs">
            {product.discountPercent}% off
          </span>
        )}

        {/* Wishlist heart button */}
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWished((v) => !v);
            setPopKey((k) => k + 1);
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-xs transition-all duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ayli-peach"
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

        {/* Quick shop pill — slides up on hover */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 px-2 pb-2">
          <span className="block w-full rounded-full bg-white/95 backdrop-blur-sm py-1.5 text-center text-[11px] font-medium tracking-wide text-ink shadow-soft">
            Quick Shop
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        <p className="line-clamp-1 text-[13px] font-medium text-ink leading-snug group-hover:text-plum transition-colors">
          {product.name}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
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

interface CategoryProductSectionProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  categorySlug: string;
  products: SerializedProductCard[];
  bgVariant?: "white" | "blush" | "beige";
}

export function CategoryProductSection({
  title,
  eyebrow = "Studio Collection",
  subtitle,
  categorySlug,
  products,
  bgVariant = "white",
}: CategoryProductSectionProps) {
  if (!products || products.length === 0) return null;

  const bgClasses = {
    white: "bg-warm-white",
    blush: "bg-blush/25 border-y border-hairline/60",
    beige: "bg-soft-beige/35 border-y border-hairline/60",
  }[bgVariant];

  const targetUrl = `/category/${categorySlug}`;

  return (
    <section className={`py-12 sm:py-16 ${bgClasses}`}>
      <div className="px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            {eyebrow && (
              <span className="text-[10px] font-semibold tracking-[0.35em] uppercase text-ayli-peach block mb-1">
                {eyebrow}
              </span>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl font-light italic text-ink leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted mt-1 max-w-md">
                {subtitle}
              </p>
            )}
          </div>
          <Link
            href={targetUrl}
            className="text-[12px] font-medium text-plum underline underline-offset-4 decoration-plum/30 hover:decoration-plum transition-all flex items-center gap-1.5 self-start sm:self-end"
          >
            <span>View all in {title}</span>
            <span className="text-ayli-peach transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Product Strip */}
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:overflow-visible sm:gap-4 sm:pb-0">
          {products.map((product, i) => (
            <CategoryProductCard
              key={product.slug}
              product={product}
              priority={i < 2}
            />
          ))}
        </div>

        {/* Bottom Explore Button */}
        <div className="mt-8 sm:mt-10 flex justify-center">
          <Link
            href={targetUrl}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-white px-7 py-2.5 text-[13px] font-medium text-ink shadow-2xs transition-all duration-200 hover:border-ayli-peach hover:text-plum hover:shadow-soft"
          >
            Explore all {title}
            <span className="text-ayli-peach">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
