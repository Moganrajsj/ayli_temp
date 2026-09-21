export interface ColourOption {
  name: string;
  hex: string;
}

/** Standard apparel sizes offered as quick-select chips in the variant builder. */
export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

/** Named dress colours with swatches shown while building variants. */
export const COLOUR_SWATCHES: ColourOption[] = [
  { name: "Black", hex: "#1A1A1A" },
  { name: "White", hex: "#F4F1EC" },
  { name: "Beige", hex: "#D8C5AE" },
  { name: "Cream", hex: "#EFE6D8" },
  { name: "Dusty Rose", hex: "#D8A2A2" },
  { name: "Blush Pink", hex: "#F2C5C8" },
  { name: "Peach", hex: "#F7C8AC" },
  { name: "Coral", hex: "#E8786A" },
  { name: "Rust Brown", hex: "#8B5A3C" },
  { name: "Maroon", hex: "#6D1F2F" },
  { name: "Red", hex: "#C2364D" },
  { name: "Navy Blue", hex: "#2C3A5C" },
  { name: "Sky Blue", hex: "#A8C6E0" },
  { name: "Teal", hex: "#2A9D8F" },
  { name: "Mint Green", hex: "#A3C9B8" },
  { name: "Olive Green", hex: "#6B6F43" },
  { name: "Forest Green", hex: "#2F4F3E" },
  { name: "Mustard", hex: "#D9A441" },
  { name: "Lavender", hex: "#B8A7CF" },
  { name: "Grey", hex: "#8C8C8C" },
];