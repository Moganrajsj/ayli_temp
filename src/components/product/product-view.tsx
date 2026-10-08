"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ViewTransition } from "react";
import type { PdpVariant } from "@/lib/catalog";
import { Gallery, type GalleryImage } from "@/components/product/gallery";
import { AddToBag } from "@/components/product/add-to-bag";

export interface ProductViewProps {
  productName: string;
  productSlug: string;
  variants: PdpVariant[];
  basePrice: number;
  images: Array<{ url: string; alt?: string | null; colour?: string | null }>;
  headerContent: ReactNode;
  accordionContent: ReactNode;
}

export function ProductView({
  productName,
  productSlug,
  variants,
  basePrice,
  images,
  headerContent,
  accordionContent,
}: ProductViewProps) {
  // Smart Default Color Selection: Find the 1st color tone with available stock.
  const defaultColour = useMemo(() => {
    const colours = [...new Set(variants.map((v) => v.colour))];
    const firstAvailable = colours.find((c) =>
      variants.some((v) => v.colour === c && v.availability.available)
    );
    return firstAvailable ?? colours[0] ?? null;
  }, [variants]);

  const [selectedColour, setSelectedColour] = useState<string | null>(defaultColour);

  const activeGalleryImages: GalleryImage[] = useMemo(() => {
    if (!images.length) return [];
    if (!selectedColour) return images;

    const colorLower = selectedColour.toLowerCase();
    const colorSpecific = images.filter((img) => img.colour?.toLowerCase() === colorLower);
    const general = images.filter((img) => !img.colour);
    const otherColors = images.filter((img) => img.colour && img.colour.toLowerCase() !== colorLower);

    if (colorSpecific.length > 0) {
      return [...colorSpecific, ...general];
    }
    return [...general, ...otherColors];
  }, [images, selectedColour]);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ViewTransition name={`product-${productSlug}`} share="morph" default="none">
        <Gallery images={activeGalleryImages} className="lg:sticky lg:top-24" />
      </ViewTransition>

      <div className="min-w-0">
        {headerContent}

        <AddToBag
          productName={productName}
          variants={variants}
          basePrice={basePrice}
          selectedColour={selectedColour}
          onSelectColour={setSelectedColour}
          className="mt-8"
        />

        <div className="mt-10">{accordionContent}</div>
      </div>
    </div>
  );
}
