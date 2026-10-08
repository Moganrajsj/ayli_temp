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

/** Fabric options for the Fabric attribute dropdown. */
export const FABRIC_OPTIONS = [
  "Cotton",
  "Cotton Blend",
  "Rayon",
  "Viscose",
  "Modal",
  "Linen",
  "Linen Blend",
  "Chanderi",
  "Georgette",
  "Chiffon",
  "Crepe",
  "Silk",
  "Silk Blend",
  "Satin",
  "Polyester",
  "Nylon",
  "Net",
  "Organza",
  "Velvet",
  "Denim",
  "Other",
] as const;

/** Pattern options for the Pattern attribute dropdown. */
export const PATTERN_OPTIONS = [
  "Solid",
  "Floral",
  "Printed",
  "Geometric",
  "Abstract",
  "Stripes",
  "Checks",
  "Polka Dots",
  "Paisley",
  "Ethnic",
  "Embroidery",
  "Embroidered",
  "Foil Print",
  "Block Print",
  "Digital Print",
  "Tie-Dye",
  "Others",
] as const;

/** Sleeve type options for the Sleeve attribute dropdown. */
export const SLEEVE_OPTIONS = [
  "Short",
  "3/4th",
  "Full",
  "Sleeveless",
  "Cap",
  "Other",
] as const;

/** Neck type options for the Neck attribute dropdown. */
export const NECK_OPTIONS = [
  "U",
  "V",
  "Round",
  "Boat",
  "Collar",
  "Square",
  "Other",
] as const;

/** Length options for the Length attribute dropdown. */
export const LENGTH_OPTIONS = [
  "Crop",
  "Short",
  "Hip Length",
  "Above Knee",
  "Knee Length",
  "Below Knee",
  "Calf Length",
  "Midi",
  "Maxi",
  "Ankle Length",
  "Floor Length",
  "Full Length",
  "Other",
] as const;

/** Fit options for the Fit attribute dropdown. */
export const FIT_OPTIONS = [
  "Regular",
  "Slim",
  "Relaxed",
  "Straight",
  "A-Line",
  "Loose",
  "Oversized",
  "Flared",
  "Wide Leg",
  "Tailored",
  "Wrap",
  "Bodycon",
  "Other",
] as const;

/** Waist options for the Waist attribute dropdown. */
export const WAIST_OPTIONS = [
  "Elasticated",
  "Semi-Elasticated",
  "Elasticated Back",
  "Drawstring",
  "Zip Front",
  "Button",
  "Belted",
  "Mid Waist",
  "High Waist",
  "Regular",
  "Other",
] as const;

/** Rise options for the Rise attribute dropdown. */
export const RISE_OPTIONS = [
  "High Rise",
  "Mid Rise",
  "Low Rise",
  "Super High Rise",
  "Other",
] as const;

/** Occasion options for the Occasion attribute dropdown. */
export const OCCASION_OPTIONS = [
  "Casual",
  "Daily Wear",
  "Office",
  "Workwear",
  "Festive",
  "Party",
  "Wedding",
  "Formal",
  "Evening",
  "Resort / Vacation",
  "Other",
] as const;

/** Material options for the Material attribute dropdown. */
export const MATERIAL_OPTIONS = [
  "Cotton",
  "Cotton Blend",
  "Rayon",
  "Viscose",
  "Modal",
  "Linen",
  "Linen Blend",
  "Silk",
  "Silk Blend",
  "Georgette",
  "Chiffon",
  "Crepe",
  "Satin",
  "Polyester",
  "Nylon",
  "Net",
  "Organza",
  "Velvet",
  "Denim",
  "Lycra / Spandex",
  "Vegan Leather",
  "Metal Alloy",
  "Gunmetal",
  "Other",
] as const;

/** Transparency options for the Transparency attribute dropdown. */
export const TRANSPARENCY_OPTIONS = [
  "Opaque",
  "Semi-Sheer",
  "Sheer",
  "Translucent",
  "Other",
] as const;

/** Stretchability options for the Stretchability attribute dropdown. */
export const STRETCHABILITY_OPTIONS = [
  "No Stretch",
  "Stretch",
  "Slight Stretch",
  "Medium Stretch",
  "High Stretch",
  "Other",
] as const;