export interface NavLink {
  name: string;
  slug: string;
  description?: string;
}

export const NAV_CATEGORIES: NavLink[] = [
  { name: "Kurtis & Tops", slug: "kurtis-tops", description: "Straight, A-line & everyday tops" },
  { name: "Co-ord Sets", slug: "co-ord-sets", description: "Top & pant, top & skirt pairings" },
  { name: "Kurta Sets", slug: "kurta-sets", description: "Ready pairings with pant & dupatta" },
  { name: "Dresses", slug: "dresses", description: "Short, midi & maxi silhouettes" },
  { name: "Bottoms", slug: "bottoms", description: "Palazzos, pants, skirts & more" },
  { name: "Fabrics", slug: "fabrics", description: "Cotton, rayon & dress materials" },
  { name: "Accessories", slug: "accessories", description: "Jewellery, bags & finishing touches" },
];

export function categoryUrl(slug: string): string {
  return `/category/${slug}`;
}