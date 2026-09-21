export interface CollectionSeed {
  name: string;
  slug: string;
  description: string;
}

export const DEFAULT_COLLECTIONS: CollectionSeed[] = [
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Fresh from the studio — the latest silhouettes at AYLI.",
  },
  {
    name: "Bestsellers",
    slug: "bestsellers",
    description: "The pieces our customers reach for again and again.",
  },
  {
    name: "Trending Now",
    slug: "trending-now",
    description: "What everyone is talking about this season.",
  },
  {
    name: "Festive Collection",
    slug: "festive-collection",
    description: "Celebration-ready looks for every festival moment.",
  },
  {
    name: "Office Wear",
    slug: "office-wear",
    description: "Polished, comfortable and boardroom-ready.",
  },
  {
    name: "Casual Wear",
    slug: "casual-wear",
    description: "Effortless everyday pieces you will live in.",
  },
  {
    name: "Party Wear",
    slug: "party-wear",
    description: "Make an entrance in styles made to be noticed.",
  },
  {
    name: "Sale",
    slug: "sale",
    description: "Loved pieces at their loveliest prices.",
  },
  {
    name: "Custom Fit",
    slug: "custom-fit",
    description: "Made to measure — stitched to your exact size.",
  },
];

export const SHOP_YOUR_WAY: CollectionSeed[] = [
  { name: "Everyday", slug: "casual-wear", description: "" },
  { name: "Office", slug: "office-wear", description: "" },
  { name: "Festive", slug: "festive-collection", description: "" },
  { name: "Party", slug: "party-wear", description: "" },
];