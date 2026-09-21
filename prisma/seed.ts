import { PrismaClient, StockStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Idempotent seed — categories, subcategories, collections and a rich product
 * catalogue (attributes, variants, inventory, images, collection links) so
 * listing, filtering, search and the PDP have real data to chew on.
 */

// ─── Categories / subcategories ─────────────────────────────────────────────

interface SubcategorySeed {
  name: string;
  slug: string;
  description?: string;
}

interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  subcategories: SubcategorySeed[];
}

const categories: CategorySeed[] = [
  {
    name: "Kurtis & Tops",
    slug: "kurtis-tops",
    description: "Everyday kurtis and tops in soft, breathable fabrics.",
    subcategories: [
      { name: "Straight Kurtis", slug: "straight-kurtis", description: "Clean, straight-cut everyday kurtis." },
      { name: "A-Line Kurtis", slug: "a-line-kurtis", description: "Flares gently from the waist for movement." },
      { name: "Short Kurtis", slug: "short-kurtis", description: "Sits above the hip — great with palazzos." },
      { name: "Long Kurtis", slug: "long-kurtis", description: "Knee-length and beyond for fuller coverage." },
      { name: "Tunics", slug: "tunics", description: "Easy silhouettes for relaxed days." },
      { name: "Casual Tops", slug: "casual-tops", description: "The everyday top edit." },
      { name: "Formal Tops", slug: "formal-tops", description: "Polished pieces for the office." },
    ],
  },
  {
    name: "Co-ord Sets",
    slug: "co-ord-sets",
    description: "Matched sets that make getting dressed effortless.",
    subcategories: [
      { name: "Top & Pant Co-ord Sets", slug: "top-pant-co-ord-sets", description: "Matched top and pant pairings." },
      { name: "Top & Skirt Co-ord Sets", slug: "top-skirt-co-ord-sets", description: "Matched top and skirt pairings." },
      { name: "Kurti Co-ord Sets", slug: "kurti-co-ord-sets", description: "Kurti with matching bottoms." },
      { name: "Casual Co-ord Sets", slug: "casual-co-ord-sets", description: "Laid-back sets for easy days." },
      { name: "Printed Co-ord Sets", slug: "printed-co-ord-sets", description: "Bold prints, perfectly matched." },
    ],
  },
  {
    name: "Kurta Sets",
    slug: "kurta-sets",
    description: "Ready-to-wear festive and everyday pairings.",
    subcategories: [
      { name: "Kurta with Pant", slug: "kurta-with-pant", description: "Kurta paired with matching pants." },
      { name: "Kurta with Dupatta", slug: "kurta-with-dupatta", description: "Kurta with a coordinating dupatta." },
      { name: "Kurta-Pant-Dupatta Sets", slug: "kurta-pant-dupatta", description: "The complete three-piece look." },
      { name: "Festive Kurta Sets", slug: "festive-kurta-sets", description: "Celebration-ready detailing." },
      { name: "Casual Kurta Sets", slug: "casual-kurta-sets", description: "Comfortable kurtas for every day." },
    ],
  },
  {
    name: "Dresses",
    slug: "dresses",
    description: "Silhouettes for every occasion — from work to weekends.",
    subcategories: [
      { name: "Short Dresses", slug: "short-dresses", description: "Above-knee styles with an easy energy." },
      { name: "Midi Dresses", slug: "midi-dresses", description: "The endlessly wearable middle length." },
      { name: "Maxi Dresses", slug: "maxi-dresses", description: "Floor-grazing drama." },
      { name: "Casual Dresses", slug: "casual-dresses", description: "Off-duty ease." },
      { name: "Office Dresses", slug: "office-dresses", description: "Boardroom to after-work." },
      { name: "Party Dresses", slug: "party-dresses", description: "Made to be noticed." },
    ],
  },
  {
    name: "Bottoms",
    slug: "bottoms",
    description: "The foundations of every well-put-together look.",
    subcategories: [
      { name: "Palazzos", slug: "palazzos", description: "Wide-leg comfort with elegant drape." },
      { name: "Straight Pants", slug: "straight-pants", description: "Classic, clean everyday trousers." },
      { name: "Trousers", slug: "trousers", description: "Tailored silhouettes." },
      { name: "Skirts", slug: "skirts", description: "From pencil to flared." },
      { name: "Leggings", slug: "leggings", description: "Stretch-fit essentials." },
      { name: "Shorts", slug: "shorts", description: "Easy, breathable warm-weather staples." },
    ],
  },
  {
    name: "Fabrics",
    slug: "fabrics",
    description: "Beautiful materials for your own creations.",
    subcategories: [
      { name: "Cotton Fabrics", slug: "cotton-fabrics", description: "Breathable, everyday cottons." },
      { name: "Rayon Fabrics", slug: "rayon-fabrics", description: "Soft drape with a fluid fall." },
      { name: "Flex Cotton", slug: "flex-cotton", description: "Comfort-stretch cotton blends." },
      { name: "Printed Fabrics", slug: "printed-fabrics", description: "Prints with personality." },
      { name: "Plain Fabrics", slug: "plain-fabrics", description: "Clean solids for custom stitching." },
      { name: "Dress Materials", slug: "dress-materials", description: "Ready-to-stitch dress lengths." },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "The finishing touches, thoughtfully made.",
    subcategories: [
      { name: "Jewellery", slug: "jewellery", description: "Everyday and occasion pieces." },
      { name: "Earrings", slug: "earrings", description: "Studs to danglers." },
      { name: "Necklaces", slug: "necklaces", description: "Delicate to statement." },
      { name: "Bracelets", slug: "bracelets", description: "Stackable and refined." },
      { name: "Handbags", slug: "handbags", description: "Sized for every day." },
      { name: "Scarves", slug: "scarves", description: "Soft finishes for every look." },
      { name: "Hair Accessories", slug: "hair-accessories", description: "Small bows and big impact." },
    ],
  },
];

// ─── Collections ────────────────────────────────────────────────────────────

const collections = [
  { name: "New Arrivals", slug: "new-arrivals", description: "Fresh from the studio — the latest silhouettes at AYLI." },
  { name: "Bestsellers", slug: "bestsellers", description: "The pieces our customers reach for again and again." },
  { name: "Trending Now", slug: "trending-now", description: "What everyone is talking about this season." },
  { name: "Festive Collection", slug: "festive-collection", description: "Celebration-ready looks for every festival moment." },
  { name: "Office Wear", slug: "office-wear", description: "Polished, comfortable and boardroom-ready." },
  { name: "Casual Wear", slug: "casual-wear", description: "Effortless everyday pieces you will live in." },
  { name: "Party Wear", slug: "party-wear", description: "Make an entrance in styles made to be noticed." },
  { name: "Sale", slug: "sale", description: "Loved pieces at their loveliest prices." },
  { name: "Custom Fit", slug: "custom-fit", description: "Made to measure — stitched to your exact size." },
];

const collectionSlugs = new Set(collections.map((c) => c.slug));

// ─── Product catalogue ──────────────────────────────────────────────────────

interface ColourSpec {
  colour: string;
  colourHex: string;
}

interface ProductSpec {
  category: string;
  subcategory?: string;
  name: string;
  mrp: number;
  discount?: number;
  isFeatured?: boolean;
  collections?: string[];
  productType?: string;
  fabric?: string;
  pattern?: string;
  printType?: string;
  sleeveType?: string;
  neckType?: string;
  length?: string;
  fit?: string;
  waist?: string;
  rise?: string;
  occasion?: string;
  material?: string;
  transparency?: string;
  stretchability?: string;
  washCare?: string;
  modelInfo?: string;
  garmentMeasurements?: string;
  shortDescription?: string;
  description?: string;
  colours: ColourSpec[];
  sizes: string[];
}

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const BOTTOM_SIZES = ["S", "M", "L", "XL", "XXL"];
const FABRIC_SIZES = ["1 Meter", "2 Meter", "3 Meter"];
const ONE_SIZE = ["One Size"];

const COL = {
  black: { colour: "Classic Black", colourHex: "#1c1c1c" },
  ivory: { colour: "Ivory", colourHex: "#f4eee3" },
  navy: { colour: "Navy", colourHex: "#26364a" },
  blue: { colour: "Dusty Blue", colourHex: "#9db6c4" },
  sage: { colour: "Sage Green", colourHex: "#a8b99a" },
  emerald: { colour: "Emerald", colourHex: "#4a7c59" },
  terracotta: { colour: "Terracotta", colourHex: "#c97b5a" },
  rust: { colour: "Rust", colourHex: "#b45a3c" },
  maroon: { colour: "Deep Maroon", colourHex: "#7a2e35" },
  mustard: { colour: "Mustard", colourHex: "#d9a441" },
  blush: { colour: "Blush Pink", colourHex: "#e6b8b0" },
  coral: { colour: "Coral", colourHex: "#e87d6d" },
  charcoal: { colour: "Charcoal", colourHex: "#4a4a4a" },
  grey: { colour: "Grey", colourHex: "#9e9e9e" },
  olive: { colour: "Olive", colourHex: "#6b7048" },
  lavender: { colour: "Lavender", colourHex: "#b9a7d6" },
  teal: { colour: "Teal", colourHex: "#3a7d7d" },
  white: { colour: "White", colourHex: "#ffffff" },
} satisfies Record<string, ColourSpec>;

const WASH_COTTON = "Machine wash cold, separately in gentle cycle. Do not bleach. Dry in shade.";
const WASH_RAYON = "Hand wash cold, separately. Do not wring. Dry in shade.";

const products: ProductSpec[] = [
  // ── Kurtis & Tops ─────────────────────────────────────────────────────────
  {
    category: "kurtis-tops", subcategory: "straight-kurtis",
    name: "Classic Chikankari Straight Kurti",
    mrp: 1499, discount: 25, isFeatured: true,
    collections: ["new-arrivals", "casual-wear", "bestsellers"],
    productType: "Straight Kurti", fabric: "Chanderi Silk", pattern: "Embroidered",
    sleeveType: "Three-Quarter Sleeve", neckType: "Round Neck", length: "Knee Length", fit: "Regular",
    occasion: "Office", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_COTTON,
    modelInfo: "Model height 5'6\", wears size M.",
    shortDescription: "Hand-embroidered chikankari on breathable chanderi — the quiet, elegant everyday kurti.",
    description: "A timeless straight-cut kurti in pure Chanderi silk with delicate tonal chikankari embroidery. Pairs effortlessly with palazzos, straight pants or jeans.",
    colours: [COL.ivory, COL.blue, COL.sage],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurtis-tops", subcategory: "a-line-kurtis",
    name: "Floral A-Line Cotton Kurti",
    mrp: 1199, discount: 15, isFeatured: true,
    collections: ["new-arrivals", "casual-wear", "trending-now"],
    productType: "A-Line Kurti", fabric: "Pure Cotton", pattern: "Printed", printType: "Floral Floral",
    sleeveType: "Short Sleeve", neckType: "Round Neck", length: "Midi", fit: "A-Line",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_COTTON,
    shortDescription: "Soft cotton a-line kurti in a fresh floral print — made for sunlit weekends.",
    description: "Breathable pure-cotton a-line kurti with a dainty all-over floral print and side slits for easy movement.",
    colours: [COL.mustard, COL.blue, COL.blush, COL.navy],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurtis-tops", subcategory: "short-kurtis",
    name: "Modal Short Kurti with Tie Waist",
    mrp: 999, discount: 20,
    collections: ["casual-wear", "trending-now"],
    productType: "Short Kurti", fabric: "Modal Lycra", pattern: "Solid",
    sleeveType: "Cap Sleeve", neckType: "V-Neck", length: "Crop", fit: "Relaxed",
    occasion: "Casual", transparency: "Opaque", stretchability: "Stretch",
    washCare: "Machine wash cold. Do not bleach. Dry in shade.",
    shortDescription: "Stretchy modal crop kurti with an oversized tie — easy comfort, all day.",
    colours: [COL.emerald, COL.charcoal, COL.mustard],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurtis-tops", subcategory: "long-kurtis",
    name: "Ajrakh Long Kurti",
    mrp: 1699, discount: 30, isFeatured: true,
    collections: ["festive-collection", "new-arrivals", "bestsellers"],
    productType: "Long Kurti", fabric: "Rayon", pattern: "Printed", printType: "Ajrakh Block Print",
    sleeveType: "Three-Quarter Sleeve", neckType: "Mandarin Collar", length: "Below Knee", fit: "Straight",
    occasion: "Festive", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "Hand-block-printed ajrakh patterns on fluid rayon, cut long and graceful.",
    description: "Traditional ajrakh motifs, hand block printed in natural dyes on soft rayon. A long silhouette with a mandarin collar and gentle side slits.",
    colours: [COL.rust, COL.navy, COL.maroon],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurtis-tops", subcategory: "tunics",
    name: "Georgette Tie-Front Tunic",
    mrp: 1299, discount: 10,
    collections: ["office-wear", "trending-now"],
    productType: "Tunic", fabric: "Georgette", pattern: "Printed", printType: "Abstract Print",
    sleeveType: "Three-Quarter Sleeve", neckType: "Round Neck", length: "Midi", fit: "Relaxed",
    occasion: "Office", transparency: "Semi-Sheer", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "An airy georgette tunic with an easy tie-front — polished without trying.",
    colours: [COL.teal, COL.black, COL.blush],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurtis-tops", subcategory: "casual-tops",
    name: "Linen Cotton Peplum Top",
    mrp: 899, discount: 0, isFeatured: true,
    collections: ["casual-wear", "bestsellers"],
    productType: "Top", fabric: "Linen Silk", pattern: "Solid",
    sleeveType: "Short Sleeve", neckType: "Boat Neck", length: "Crop", fit: "A-Line",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Gentle machine wash in cold water. Iron on low.",
    shortDescription: "Breezy linen-silk peplum top with a flattering boat neck.",
    colours: [COL.ivory, COL.blue, COL.olive],
    sizes: APPAREL_SIZES.slice(0, 5),
  },
  {
    category: "kurtis-tops", subcategory: "formal-tops",
    name: "Satin Bow Formal Top",
    mrp: 1599, discount: 20,
    collections: ["office-wear", "new-arrivals"],
    productType: "Top", fabric: "Satin", pattern: "Solid",
    sleeveType: "Three-Quarter Sleeve", neckType: "Round Neck", length: "Hip Length", fit: "Slim",
    occasion: "Office", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Dry clean recommended.",
    shortDescription: "A sleek satin top with a soft bow at the neck — office wear with personality.",
    colours: [COL.charcoal, COL.lavender, COL.maroon],
    sizes: APPAREL_SIZES.slice(0, 5),
  },
  {
    category: "kurtis-tops", subcategory: "straight-kurtis",
    name: "Everyday Cotton Straight Kurti",
    mrp: 899, discount: 10,
    collections: ["casual-wear", "sale"],
    productType: "Straight Kurti", fabric: "Pure Cotton", pattern: "Striped",
    sleeveType: "Short Sleeve", neckType: "Round Neck", length: "Knee Length", fit: "Regular",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_COTTON,
    shortDescription: "Your go-to striped cotton kurti — soft, breathable and endlessly wearable.",
    colours: [COL.blue, COL.white, COL.mustard],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurtis-tops", subcategory: "short-kurtis",
    name: "Checked Side-Slit Short Kurti",
    mrp: 1099, discount: 25,
    collections: ["casual-wear", "trending-now"],
    productType: "Short Kurti", fabric: "Viscose", pattern: "Checkered",
    sleeveType: "Cap Sleeve", neckType: "Keyhole Neck", length: "Hip Length", fit: "Regular",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "A refined checked viscose kurti with a keyhole neck and easy side slits.",
    colours: [COL.blue, COL.navy, COL.coral],
    sizes: APPAREL_SIZES.slice(0, 5),
  },
  {
    category: "kurtis-tops", subcategory: "a-line-kurtis",
    name: "Sage A-Line Woven Kurti",
    mrp: 1349, discount: 15,
    collections: ["casual-wear", "bestsellers"],
    productType: "A-Line Kurti", fabric: "Organza", pattern: "Solid",
    sleeveType: "Short Sleeve", neckType: "Boat Neck", length: "Knee Length", fit: "A-Line",
    occasion: "Casual", transparency: "Semi-Sheer", stretchability: "No Stretch", washCare: WASH_COTTON,
    shortDescription: "Featherlight organza a-line kurti with subtle sheen.",
    colours: [COL.sage, COL.blue, COL.ivory],
    sizes: APPAREL_SIZES,
  },

  // ── Co-ord Sets ───────────────────────────────────────────────────────────
  {
    category: "co-ord-sets", subcategory: "top-pant-co-ord-sets",
    name: "Ribbed Knit Lounge Co-ord Set",
    mrp: 1899, discount: 20, isFeatured: true,
    collections: ["casual-wear", "trending-now", "new-arrivals"],
    productType: "Co-ord Set", fabric: "Cotton Rib", pattern: "Solid",
    neckType: "Crew Neck", length: "Ankle Length", fit: "Relaxed",
    occasion: "Casual", transparency: "Opaque", stretchability: "Stretch",
    washCare: "Machine wash cold, inside out. Dry in shade.",
    shortDescription: "A buttery ribbed lounge set — matching top and wide pant for easy days.",
    colours: [COL.sage, COL.charcoal, COL.lavender],
    sizes: APPAREL_SIZES,
  },
  {
    category: "co-ord-sets", subcategory: "top-skirt-co-ord-sets",
    name: "Pleated Top and Skirt Co-ord",
    mrp: 2299, discount: 25, isFeatured: true,
    collections: ["festive-collection", "bestsellers", "new-arrivals"],
    productType: "Co-ord Set", fabric: "Rayon", pattern: "Solid",
    sleeveType: "Short Sleeve", neckType: "Round Neck", length: "Midi", fit: "A-Line",
    occasion: "Party", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "An elegantly pleated top-and-skirt set that moves like a dream.",
    colours: [COL.blush, COL.black, COL.sage],
    sizes: APPAREL_SIZES,
  },
  {
    category: "co-ord-sets", subcategory: "kurti-co-ord-sets",
    name: "Easy Kurti Pant Co-ord",
    mrp: 1799, discount: 10,
    collections: ["casual-wear", "office-wear"],
    productType: "Co-ord Set", fabric: "Modal Lycra", pattern: "Solid",
    sleeveType: "Three-Quarter Sleeve", neckType: "V-Neck", length: "Knee Length", fit: "Straight",
    occasion: "Office", transparency: "Opaque", stretchability: "Stretch",
    washCare: "Machine wash cold. Do not bleach.",
    shortDescription: "A matched kurti-and-pant set in comfy modal lycra.",
    colours: [COL.emerald, COL.navy, COL.mustard],
    sizes: APPAREL_SIZES,
  },
  {
    category: "co-ord-sets", subcategory: "printed-co-ord-sets",
    name: "Bold Print Camp Collar Co-ord",
    mrp: 2099, discount: 30,
    collections: ["trending-now", "party-wear"],
    productType: "Co-ord Set", fabric: "Viscose", pattern: "Printed", printType: "Geometric Print",
    sleeveType: "Short Sleeve", neckType: "Camp Collar", length: "Ankle Length", fit: "Relaxed",
    occasion: "Party", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "A statement geometric print on a camp-collar co-ord made to be noticed.",
    colours: [COL.coral, COL.navy, COL.blue],
    sizes: APPAREL_SIZES.slice(0, 5),
  },
  {
    category: "co-ord-sets", subcategory: "casual-co-ord-sets",
    name: "Chambray Button-Up Co-ord",
    mrp: 1999, discount: 15,
    collections: ["casual-wear", "office-wear"],
    productType: "Co-ord Set", fabric: "Chambray", pattern: "Solid",
    sleeveType: "Short Sleeve", neckType: "Button-Down Collar", length: "Ankle Length", fit: "Relaxed",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Machine wash cold, separately. Line dry.",
    shortDescription: "Laid-back chambray shirt-and-pant set — crisp, easy, endlessly useful.",
    colours: [COL.blue, COL.ivory],
    sizes: APPAREL_SIZES,
  },
  {
    category: "co-ord-sets", subcategory: "kurti-co-ord-sets",
    name: "Printed Kurti Palazzo Co-ord",
    mrp: 1899, discount: 20,
    collections: ["festive-collection", "casual-wear"],
    productType: "Co-ord Set", fabric: "Rayon", pattern: "Printed", printType: "Floral Print",
    sleeveType: "Three-Quarter Sleeve", neckType: "Round Neck", length: "Knee Length", fit: "A-Line",
    occasion: "Festive", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "A festive floral kurti matched to flowing palazzos.",
    colours: [COL.maroon, COL.mustard, COL.blue],
    sizes: BOTTOM_SIZES,
  },

  // ── Kurta Sets ────────────────────────────────────────────────────────────
  {
    category: "kurta-sets", subcategory: "kurta-with-pant",
    name: "Ivory Printed Kurta and Straight Pant",
    mrp: 2499, discount: 25, isFeatured: true,
    collections: ["festive-collection", "bestsellers", "new-arrivals"],
    productType: "Kurta Set", fabric: "Rayon", pattern: "Printed", printType: "Paisley Print",
    sleeveType: "Three-Quarter Sleeve", neckType: "Round Neck", length: "Knee Length", fit: "Straight",
    occasion: "Festive", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "A timeless ivory kurta with tonal paisley print and matching straight pants.",
    description: "Festive-ready set with an earthy paisley print in muted tones. The straight pant completes a graceful, minimal silhouette.",
    colours: [COL.ivory, COL.blue, COL.maroon],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurta-sets", subcategory: "kurta-with-dupatta",
    name: "Georgette Kurta and Dupatta Set",
    mrp: 2999, discount: 30,
    collections: ["festive-collection", "party-wear"],
    productType: "Kurta Set", fabric: "Georgette", pattern: "Printed", printType: "Floral Print",
    sleeveType: "Three-Quarter Sleeve", neckType: "Square Neck", length: "Midi", fit: "A-Line",
    occasion: "Wedding", transparency: "Semi-Sheer", stretchability: "No Stretch",
    washCare: "Dry clean recommended.",
    shortDescription: "An airy georgette kurta with its own dupatta — festivity, minus the fuss.",
    colours: [COL.blush, COL.teal, COL.maroon],
    sizes: APPAREL_SIZES.slice(0, 5),
  },
  {
    category: "kurta-sets", subcategory: "kurta-pant-dupatta",
    name: "Three-Piece Chikankari Festive Set",
    mrp: 3899, discount: 25, isFeatured: true,
    collections: ["festive-collection", "bestsellers"],
    productType: "Kurta Set", fabric: "Chanderi Silk", pattern: "Embroidered",
    sleeveType: "Three-Quarter Sleeve", neckType: "Mandarin Collar", length: "Midi", fit: "Regular",
    occasion: "Wedding", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Dry clean recommended.",
    shortDescription: "Complete three-piece chikankari set — kurta, pant and hand-finished dupatta.",
    colours: [COL.ivory, COL.blue, COL.blush],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurta-sets", subcategory: "festive-kurta-sets",
    name: "Maroon Bandhani Festive Kurta Set",
    mrp: 2799, discount: 20,
    collections: ["festive-collection", "party-wear"],
    productType: "Kurta Set", fabric: "Georgette", pattern: "Printed", printType: "Bandhani",
    sleeveType: "Three-Quarter Sleeve", neckType: "Keyhole Neck", length: "Knee Length", fit: "A-Line",
    occasion: "Festive", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "Traditional bandhani knots in rich maroon — family photographs sorted.",
    colours: [COL.maroon, COL.mustard, COL.blue],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurta-sets", subcategory: "casual-kurta-sets",
    name: "Cotton Slub Casual Kurta Set",
    mrp: 1999, discount: 10,
    collections: ["casual-wear", "office-wear"],
    productType: "Kurta Set", fabric: "Cotton Slub", pattern: "Solid",
    sleeveType: "Short Sleeve", neckType: "Round Neck", length: "Knee Length", fit: "Relaxed",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_COTTON,
    shortDescription: "Everyday cotton kurta with relaxed straight pants — low effort, high comfort.",
    colours: [COL.sage, COL.grey, COL.blue],
    sizes: APPAREL_SIZES,
  },
  {
    category: "kurta-sets", subcategory: "kurta-pant-dupatta",
    name: "Silk Blend Wedding Day Set",
    mrp: 4999, discount: 20,
    collections: ["festive-collection", "party-wear"],
    productType: "Kurta Set", fabric: "Silk Blend", pattern: "Solid",
    sleeveType: "Full Sleeve", neckType: "Mandarin Collar", length: "Ankle Length", fit: "Straight",
    occasion: "Wedding", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Dry clean only.",
    shortDescription: "A regal silk-blend kurta, pant and dupatta set for big days.",
    colours: [COL.blush, COL.emerald, COL.navy],
    sizes: APPAREL_SIZES.slice(0, 5),
  },

  // ── Dresses ───────────────────────────────────────────────────────────────
  {
    category: "dresses", subcategory: "midi-dresses",
    name: "Wrap Midi Dress in Floral Rayon",
    mrp: 2199, discount: 25, isFeatured: true,
    collections: ["office-wear", "trending-now", "bestsellers"],
    productType: "Midi Dress", fabric: "Rayon", pattern: "Printed", printType: "Floral Print",
    sleeveType: "Three-Quarter Sleeve", neckType: "Wrap Neck", length: "Midi", fit: "Wrap",
    occasion: "Office", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "The endlessly flattering wrap midi in a soft floral rayon.",
    colours: [COL.blue, COL.maroon, COL.emerald],
    sizes: APPAREL_SIZES,
  },
  {
    category: "dresses", subcategory: "maxi-dresses",
    name: "Tiered Maxi Dress",
    mrp: 2399, discount: 15,
    collections: ["casual-wear", "new-arrivals"],
    productType: "Maxi Dress", fabric: "Viscose", pattern: "Printed", printType: "Ethnic Print",
    sleeveType: "Short Sleeve", neckType: "V-Neck", length: "Maxi", fit: "A-Line",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "Layers of breezy viscose in a playful ethnic print — swing-girl energy.",
    colours: [COL.mustard, COL.blue, COL.blush],
    sizes: APPAREL_SIZES.slice(0, 5),
  },
  {
    category: "dresses", subcategory: "short-dresses",
    name: "Shirt Dress in Cotton Poplin",
    mrp: 1799, discount: 10,
    collections: ["casual-wear", "office-wear"],
    productType: "Short Dress", fabric: "Cotton Poplin", pattern: "Striped",
    sleeveType: "Short Sleeve", neckType: "Button-Down Collar", length: "Crop", fit: "Relaxed",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_COTTON,
    shortDescription: "Crisp poplin shirt-dress with a waist tie for structure.",
    colours: [COL.blue, COL.white, COL.olive],
    sizes: APPAREL_SIZES,
  },
  {
    category: "dresses", subcategory: "office-dresses",
    name: "Structured Sheath Office Dress",
    mrp: 2599, discount: 20, isFeatured: true,
    collections: ["office-wear", "bestsellers"],
    productType: "Office Dress", fabric: "Crepe", pattern: "Solid",
    sleeveType: "Three-Quarter Sleeve", neckType: "Round Neck", length: "Knee Length", fit: "Slim",
    occasion: "Office", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Gentle machine wash or dry clean.",
    shortDescription: "A clean-lined crepe sheath — the quiet powerhouse of your work week.",
    colours: [COL.charcoal, COL.navy, COL.black],
    sizes: APPAREL_SIZES,
  },
  {
    category: "dresses", subcategory: "party-dresses",
    name: "Sequin Strapless Party Dress",
    mrp: 3299, discount: 25,
    collections: ["party-wear", "new-arrivals"],
    productType: "Party Dress", fabric: "Sequin Mesh", pattern: "Solid",
    neckType: "Strapless", length: "Knee Length", fit: "Slim",
    occasion: "Party", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Dry clean recommended. Store on a padded hanger.",
    shortDescription: "Head-turning shimmer in a strapless party silhouette.",
    colours: [COL.black, COL.lavender, COL.teal],
    sizes: APPAREL_SIZES.slice(0, 5),
  },
  {
    category: "dresses", subcategory: "casual-dresses",
    name: "Comfy Jersey Side-Pocket Dress",
    mrp: 1299, discount: 20,
    collections: ["casual-wear", "sale"],
    productType: "Casual Dress", fabric: "Jersey Knit", pattern: "Solid",
    sleeveType: "Short Sleeve", neckType: "Crew Neck", length: "Midi", fit: "Relaxed",
    occasion: "Casual", transparency: "Opaque", stretchability: "Stretch",
    washCare: "Machine wash cold, inside out. Do not tumble dry.",
    shortDescription: "The dress you will live in — soft jersey, side pockets, zero effort.",
    colours: [COL.olive, COL.charcoal, COL.mustard],
    sizes: APPAREL_SIZES,
  },
  {
    category: "dresses", subcategory: "midi-dresses",
    name: "Belted Tiered Midi Dress",
    mrp: 1999, discount: 15,
    collections: ["casual-wear", "office-wear"],
    productType: "Midi Dress", fabric: "Cotton", pattern: "Checkered",
    sleeveType: "Short Sleeve", neckType: "Square Neck", length: "Midi", fit: "A-Line",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_COTTON,
    shortDescription: "A gingham midi with a tie belt — picnic, brunch, repeat.",
    colours: [COL.blue, COL.blush, COL.teal],
    sizes: APPAREL_SIZES,
  },
  {
    category: "dresses", subcategory: "maxi-dresses",
    name: "Chiffon Evening Maxi",
    mrp: 2899, discount: 30,
    collections: ["party-wear", "festive-collection"],
    productType: "Maxi Dress", fabric: "Chiffon", pattern: "Printed", printType: "Abstract Print",
    neckType: "Halter Neck", length: "Maxi", fit: "A-Line",
    occasion: "Party", transparency: "Semi-Sheer", stretchability: "No Stretch",
    washCare: "Dry clean recommended.",
    shortDescription: "Featherweight chiffon maxi with an elegant halter neck.",
    colours: [COL.lavender, COL.maroon, COL.emerald],
    sizes: APPAREL_SIZES.slice(0, 5),
  },

  // ── Bottoms ───────────────────────────────────────────────────────────────
  {
    category: "bottoms", subcategory: "palazzos",
    name: "Flared Cotton Palazzos",
    mrp: 1199, discount: 20, isFeatured: true,
    collections: ["casual-wear", "bestsellers"],
    productType: "Palazzo", fabric: "Cotton", pattern: "Printed", printType: "Floral Print",
    waist: "Elasticated", rise: "High Rise", length: "Ankle Length", fit: "Wide Leg",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_COTTON,
    shortDescription: "Wide-leg cotton palazzos that move with you — elasticated waist, easy drape.",
    colours: [COL.mustard, COL.blue, COL.emerald],
    sizes: BOTTOM_SIZES,
  },
  {
    category: "bottoms", subcategory: "straight-pants",
    name: "Structured Straight Trousers",
    mrp: 1499, discount: 15,
    collections: ["office-wear", "trending-now"],
    productType: "Trousers", fabric: "Crepe", pattern: "Solid",
    waist: "Zip Front", rise: "Mid Rise", length: "Full Length", fit: "Straight",
    occasion: "Office", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Dry clean recommended.",
    shortDescription: "Sharp crepe trousers with a neat zip front — the office staple.",
    colours: [COL.charcoal, COL.navy, COL.sage],
    sizes: BOTTOM_SIZES,
  },
  {
    category: "bottoms", subcategory: "trousers",
    name: "Comfort Stretch Formal Trousers",
    mrp: 1699, discount: 25,
    collections: ["office-wear", "bestsellers"],
    productType: "Trousers", fabric: "Poly Lycra", pattern: "Solid",
    waist: "Elasticated Back", rise: "Mid Rise", length: "Full Length", fit: "Tailored",
    occasion: "Office", transparency: "Opaque", stretchability: "Stretch",
    washCare: "Machine wash cold, hang dry.",
    shortDescription: "All-day comfort without the compromise — tailored lycra trousers.",
    colours: [COL.black, COL.grey, COL.charcoal],
    sizes: BOTTOM_SIZES,
  },
  {
    category: "bottoms", subcategory: "skirts",
    name: "Pleated Midi Skirt",
    mrp: 1299, discount: 20,
    collections: ["office-wear", "casual-wear"],
    productType: "Skirt", fabric: "Viscose", pattern: "Solid",
    waist: "Elasticated", rise: "High Rise", length: "Midi", fit: "A-Line",
    occasion: "Office", transparency: "Opaque", stretchability: "No Stretch", washCare: WASH_RAYON,
    shortDescription: "Knife-pleated and endlessly swishy — the forgiving midi skirt.",
    colours: [COL.emerald, COL.blue, COL.maroon],
    sizes: BOTTOM_SIZES,
  },
  {
    category: "bottoms", subcategory: "leggings",
    name: "High-Rise Brushed Leggings",
    mrp: 799, discount: 10,
    collections: ["casual-wear", "sale"],
    productType: "Leggings", fabric: "Cotton Lycra", pattern: "Solid",
    waist: "Elasticated", rise: "High Rise", length: "Full Length", fit: "Slim",
    occasion: "Casual", transparency: "Opaque", stretchability: "Stretch",
    washCare: "Machine wash cold. Do not bleach.",
    shortDescription: "Squat-proof, stay-put leggings in soft brushed cotton lycra.",
    colours: [COL.black, COL.charcoal, COL.navy],
    sizes: BOTTOM_SIZES,
  },
  {
    category: "bottoms", subcategory: "shorts",
    name: "Linen Blend Tailored Shorts",
    mrp: 999, discount: 15,
    collections: ["casual-wear", "trending-now"],
    productType: "Shorts", fabric: "Linen Blend", pattern: "Solid",
    waist: "Zip Front", rise: "Mid Rise", length: "Above Knee", fit: "Relaxed",
    occasion: "Casual", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Machine wash cold, line dry.",
    shortDescription: "Breathable linen shorts with a clean tailored line.",
    colours: [COL.ivory, COL.olive, COL.blue],
    sizes: BOTTOM_SIZES,
  },

  // ── Fabrics ───────────────────────────────────────────────────────────────
  {
    category: "fabrics", subcategory: "rayon-fabrics",
    name: "Rayon Fabric — Fluid Drape",
    mrp: 349, discount: 10, isFeatured: true,
    collections: ["new-arrivals", "casual-wear"],
    productType: "Dress Material", fabric: "Rayon", pattern: "Solid",
    material: "Viscose", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Prewash before stitching. Hand wash or gentle machine cycle.",
    shortDescription: "Soft, fluid rayon per metre — perfect for kurtis and dresses.",
    colours: [COL.blue, COL.teal, COL.blush, COL.maroon],
    sizes: FABRIC_SIZES,
  },
  {
    category: "fabrics", subcategory: "cotton-fabrics",
    name: "Mulmul Cotton Fabric",
    mrp: 299, discount: 5,
    collections: ["casual-wear", "bestsellers"],
    productType: "Dress Material", fabric: "Mulmul Cotton", pattern: "Solid",
    material: "Cotton", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Prewash before stitching. Gentle machine wash.",
    shortDescription: "Featherlight mulmul — the softest fabric for breezy kurta sets.",
    colours: [COL.ivory, COL.sage, COL.mustard],
    sizes: FABRIC_SIZES,
  },
  {
    category: "fabrics", subcategory: "printed-fabrics",
    name: "Printed Dress Material — Floral",
    mrp: 399, discount: 20,
    collections: ["new-arrivals", "trending-now"],
    productType: "Dress Material", fabric: "Viscose", pattern: "Printed", printType: "Floral Print",
    material: "Viscose", transparency: "Opaque", stretchability: "No Stretch",
    washCare: "Prewash before stitching. Hand wash recommended.",
    shortDescription: "Two-and-a-half metres of peppy floral viscose, ready to become a dress.",
    colours: [COL.mustard, COL.blue, COL.blush],
    sizes: ["2 Meter"],
  },
  {
    category: "fabrics", subcategory: "dress-materials",
    name: "Georgette Unstitched Dress Material",
    mrp: 449, discount: 25,
    collections: ["festive-collection", "custom-fit"],
    productType: "Dress Material", fabric: "Georgette", pattern: "Solid",
    material: "Polyester", transparency: "Semi-Sheer", stretchability: "No Stretch",
    washCare: "Dry clean recommended. Store folded, avoid creasing.",
    shortDescription: "Elegant georgette lengths for stitched-to-fit festive dresses.",
    colours: [COL.blush, COL.emerald, COL.lavender],
    sizes: ["2.5 Meter"],
  },

  // ── Accessories ───────────────────────────────────────────────────────────
  {
    category: "accessories", subcategory: "earrings",
    name: "Oxidised Silver Jhumka Earrings",
    mrp: 599, discount: 15, isFeatured: true,
    collections: ["festive-collection", "party-wear", "new-arrivals"],
    productType: "Earrings", material: "Gunmetal", pattern: "Solid",
    occasion: "Festive", washCare: "Wipe with a soft dry cloth. Keep away from perfume.",
    shortDescription: "Traditional jhumkas with an oxidised finish — festival-ready shine.",
    colours: [COL.grey],
    sizes: ONE_SIZE,
  },
  {
    category: "accessories", subcategory: "necklaces",
    name: "Gold-Tone Layered Necklace",
    mrp: 799, discount: 20,
    collections: ["party-wear", "bestsellers"],
    productType: "Necklace", material: "Metal Alloy", pattern: "Solid",
    occasion: "Party", washCare: "Wipe with a soft cloth. Store in the pouch provided.",
    shortDescription: "Two-strand gold-tone necklace with a delicate drop.",
    colours: [COL.mustard],
    sizes: ONE_SIZE,
  },
  {
    category: "accessories", subcategory: "handbags",
    name: "Structured Slouch Handbag",
    mrp: 1299, discount: 25,
    collections: ["office-wear", "new-arrivals"],
    productType: "Handbag", material: "Vegan Leather", pattern: "Solid",
    occasion: "Office", washCare: "Wipe clean with a damp cloth. Store with the dust bag.",
    shortDescription: "A roomy structured slouch bag in smooth vegan leather.",
    colours: [COL.navy, COL.charcoal, COL.blush],
    sizes: ONE_SIZE,
  },
  {
    category: "accessories", subcategory: "scarves",
    name: "Soft Rayon Printed Scarf",
    mrp: 499, discount: 30,
    collections: ["casual-wear", "sale"],
    productType: "Scarf", fabric: "Rayon", pattern: "Printed", printType: "Block Print",
    material: "Rayon", occasion: "Casual", washCare: WASH_RAYON,
    shortDescription: "A generous rayon scarf in hand block prints — for the neck or the bag.",
    colours: [COL.blue, COL.mustard, COL.blush],
    sizes: ONE_SIZE,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function imageUrls(slug: string): Array<{ url: string; alt: string }> {
  const base = (view: number) =>
    `https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,h_1000,w_800,f_auto,q_auto/v1/ayli/products/${slug}-${view}.jpg`;
  return [1, 2, 3].map((view, index) => ({
    url: base(view),
    alt: `AYLI product view ${index + 1}`,
  }));
}

function colourCode(colour: string): string {
  return colour
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function inventoryFor(productIndex: number, variantIndex: number) {
  // Sprinkle some low-stock and out-of-stock combos so the UI states are real.
  const soldOut = (productIndex + variantIndex) % 11 === 0;
  const low = (productIndex * 7 + variantIndex * 3) % 13 === 0;
  const stockQuantity = soldOut ? 0 : low ? 2 : 5 + ((variantIndex * 11 + productIndex) % 40);
  const reservedQuantity = soldOut ? 0 : Math.min(1, Math.floor(stockQuantity / 5));

  let stockStatus: StockStatus = StockStatus.IN_STOCK;
  if (stockQuantity === 0) stockStatus = StockStatus.OUT_OF_STOCK;
  else if (stockQuantity <= 5) stockStatus = StockStatus.LOW_STOCK;

  return { stockQuantity, reservedQuantity, stockStatus };
}

async function syncProduct(spec: ProductSpec, index: number) {
  const sellingPrice =
    spec.discount != null && spec.discount > 0
      ? Math.round(spec.mrp * (1 - spec.discount / 100))
      : spec.mrp;

  const slug = spec.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: spec.category },
    select: { id: true },
  });

  const product = await prisma.product.upsert({
    where: { slug },
    update: {
      name: spec.name,
      shortDescription: spec.shortDescription,
      description: spec.description,
      productType: spec.productType,
      brand: "AYLI",
      isActive: true,
      isFeatured: spec.isFeatured ?? false,
      mrp: spec.mrp,
      sellingPrice,
      taxRate: 5,
      fabric: spec.fabric,
      pattern: spec.pattern,
      printType: spec.printType,
      sleeveType: spec.sleeveType,
      neckType: spec.neckType,
      length: spec.length,
      fit: spec.fit,
      waist: spec.waist,
      rise: spec.rise,
      occasion: spec.occasion,
      material: spec.material,
      transparency: spec.transparency,
      stretchability: spec.stretchability,
      washCare: spec.washCare,
      modelInfo: spec.modelInfo,
      garmentMeasurements: spec.garmentMeasurements,
    },
    create: {
      name: spec.name,
      slug,
      sku: `AYLI-${spec.category.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6)}-${String(index + 1).padStart(3, "0")}`,
      shortDescription: spec.shortDescription,
      description: spec.description,
      productType: spec.productType,
      brand: "AYLI",
      isActive: true,
      isFeatured: spec.isFeatured ?? false,
      mrp: spec.mrp,
      sellingPrice,
      costPrice: Math.round(sellingPrice * 0.6),
      taxRate: 5,
      fabric: spec.fabric,
      pattern: spec.pattern,
      printType: spec.printType,
      sleeveType: spec.sleeveType,
      neckType: spec.neckType,
      length: spec.length,
      fit: spec.fit,
      waist: spec.waist,
      rise: spec.rise,
      occasion: spec.occasion,
      material: spec.material,
      transparency: spec.transparency,
      stretchability: spec.stretchability,
      washCare: spec.washCare,
      modelInfo: spec.modelInfo,
      garmentMeasurements: spec.garmentMeasurements,
      category: { connect: { slug: spec.category } },
      ...(spec.subcategory
        ? {
            subcategory: {
              connect: {
                categoryId_slug: { categoryId: category.id, slug: spec.subcategory },
              },
            },
          }
        : {}),
    },
  });

  // Idempotent children reset — variants cascade to inventory.
  await Promise.all([
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.productVariant.deleteMany({ where: { productId: product.id } }),
    prisma.productCollection.deleteMany({ where: { productId: product.id } }),
  ]);

  await prisma.productImage.createMany({
    data: imageUrls(slug).map((image, i) => ({
      productId: product.id,
      url: image.url,
      alt: `${spec.name} — ${image.alt}`,
      sortOrder: i,
      isMain: i === 0,
    })),
  });

  let variantIndex = 0;
  for (const colourSpec of spec.colours) {
    for (const size of spec.sizes) {
      const inventory = inventoryFor(index, variantIndex);
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `${product.sku}-${colourCode(colourSpec.colour)}-${size.replace(/\s+/g, "")}`,
          colour: colourSpec.colour,
          colourHex: colourSpec.colourHex,
          size,
          isActive: true,
          inventory: {
            create: {
              stockQuantity: inventory.stockQuantity,
              reservedQuantity: inventory.reservedQuantity,
              lowStockThreshold: 5,
              stockStatus: inventory.stockStatus,
            },
          },
        },
      });
      variantIndex += 1;
    }
  }

  if (spec.collections?.length) {
    for (const collectionSlug of spec.collections) {
      if (!collectionSlugs.has(collectionSlug)) continue;
      await prisma.productCollection.create({
        data: {
          productId: product.id,
          collectionId: (await prisma.collection.findUniqueOrThrow({
            where: { slug: collectionSlug },
            select: { id: true },
          })).id,
        },
      });
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, isActive: true },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: true,
      },
    });

    for (const [subIndex, sub] of category.subcategories.entries()) {
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: created.id, slug: sub.slug } },
        update: { name: sub.name, description: sub.description, isActive: true },
        create: {
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          categoryId: created.id,
          sortOrder: subIndex,
          isActive: true,
        },
      });
    }
  }

  for (const [index, collection] of collections.entries()) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: { name: collection.name, description: collection.description, isActive: true },
      create: {
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        sortOrder: index,
        isActive: true,
      },
    });
  }

  for (const [index, spec] of products.entries()) {
    await syncProduct(spec, index);
  }

  const categoryCount = await prisma.category.count();
  const subcategoryCount = await prisma.subcategory.count();
  const collectionCount = await prisma.collection.count();
  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();

  console.log(
    `Seed complete — ${categoryCount} categories, ${subcategoryCount} subcategories, ` +
      `${collectionCount} collections, ${productCount} products, ${variantCount} variants.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());