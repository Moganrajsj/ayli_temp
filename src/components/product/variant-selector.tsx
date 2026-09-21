"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { PdpVariant } from "@/lib/catalog";
import { Icon } from "@/components/ui/icons";

export interface VariantSelectorProps {
  variants: PdpVariant[];
  selectedColour: string | null;
  selectedSize: string | null;
  onSelectColour: (colour: string) => void;
  onSelectSize: (size: string) => void;
  className?: string;
}

function parseColourName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Colour swatches + size chips. Sizes are gated behind an initial colour
 * choice and reflect real availability (stock) for that colour.
 */
export function VariantSelector({
  variants,
  selectedColour,
  selectedSize,
  onSelectColour,
  onSelectSize,
  className,
}: VariantSelectorProps) {
  const colourVariants = (colour: string) =>
    variants.filter((v) => v.colour === colour);

  const sizesFor = (colour: string) => [
    ...new Set(colourVariants(colour).map((v) => v.size)),
  ];

  const colourAvailable = (colour: string) =>
    colourVariants(colour).some((v) => v.availability.available);

  const allSizes = [...new Set(variants.map((v) => v.size))];
  const colours = [...new Set(variants.map((v) => v.colour))];
  const sizesForSelection = selectedColour ? sizesFor(selectedColour) : [];

  const handleColour = (colour: string) => {
    onSelectColour(colour);
    if (selectedSize && !sizesFor(colour).includes(selectedSize)) {
      onSelectSize("");
    }
  };

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-ink">Colour</p>
          <p className="truncate text-sm text-muted">
            {selectedColour ? parseColourName(selectedColour) : "Select a colour"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {colours.map((colour) => {
            const variant = colourVariants(colour)[0];
            const isSelected = colour === selectedColour;
            const soldOut = !colourAvailable(colour);
            return (
              <button
                key={colour}
                type="button"
                disabled={soldOut}
                aria-pressed={isSelected}
                onClick={() => handleColour(colour)}
                title={parseColourName(colour)}
                className={cn(
                  "relative grid h-9 w-9 place-items-center rounded-full border transition-all duration-150 active:scale-95 disabled:cursor-not-allowed",
                  isSelected
                    ? "border-ayli-blue ring-2 ring-ayli-blue/30"
                    : "border-hairline hover:border-muted"
                )}
              >
                <span
                  className="h-6 w-6 rounded-full border border-ink/10"
                  style={{
                    backgroundColor: variant?.colourHex ?? "#f0f0f0",
                  }}
                />
                {soldOut ? (
                  <span className="absolute inset-0 grid place-items-center">
                    <IconXLine />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink">Size</p>
          <div className="flex items-center gap-3">
            <Link
              href="/size-guide"
              className="inline-flex items-center gap-1 text-xs font-medium text-ayli-blue underline-offset-2 transition-colors hover:text-[#1496a8] hover:underline"
            >
              Size guide
              <Icon name="chevron-right" className="h-3 w-3 rotate-90" />
            </Link>
            <p className="text-sm text-muted">
              {selectedColour
                ? selectedSize
                  ? `${selectedSize} selected`
                  : "Select a size"
                : "Choose a colour first"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedColour
            ? sizesForSelection.map((size) => {
                const available = variants.some(
                  (v) =>
                    v.colour === selectedColour &&
                    v.size === size &&
                    v.availability.available
                );
                return (
                  <SizeChip
                    key={size}
                    size={size}
                    selected={size === selectedSize}
                    disabled={!available}
                    onClick={() => onSelectSize(size)}
                  />
                );
              })
            : allSizes.map((size) => (
                <SizeChip key={size} size={size} disabled />
              ))}
        </div>
      </div>
    </div>
  );
}

function IconXLine() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

interface SizeChipProps {
  size: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function SizeChip({ size, selected = false, disabled = false, onClick }: SizeChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-w-11 rounded-card border px-3 py-2 text-sm font-medium transition-all duration-200",
        selected
          ? "border-ayli-blue bg-ayli-blue/10 text-ink shadow-[0_0_0_3px_rgb(91,127,212/0.12)]"
          : "border-hairline text-ink hover:border-muted",
        disabled &&
          "cursor-not-allowed text-muted/50 line-through hover:border-hairline"
      )}
    >
      {size}
    </button>
  );
}