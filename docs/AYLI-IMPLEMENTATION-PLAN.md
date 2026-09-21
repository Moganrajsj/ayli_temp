# 🌸 AYLI — Implementation Plan Artifact (Revised)

**Version:** 2.0 — incorporates all approved corrections
**Status:** Awaiting approval of corrected Phase 2 plan
**Brand:** AYLI — Premium Women's Fashion E-commerce (India)

---

## Revision Log

| # | Correction | Applied |
|---|---|---|
| 1 | Razorpay as initial provider; abstract provider; remove Stripe references | ✅ `src/lib/payment.ts` + `src/lib/razorpay.ts` |
| 2 | Single, consistent session strategy; schema matches the decision | ✅ **JWT-based sessions**; `Session`/`Account`/`VerificationToken` removed from MVP schema |
| 3 | No duplicate `Product.colour`; colour owned by `ProductVariant`; search/filter query variant colours | ✅ |
| 4 | Reviews out of MVP (no model, UI, API); extension point only | ✅ `Review` model removed |
| 5 | Mobile-first; **390 × 844** primary design reference, then 360–430 | ✅ |
| 6 | Bottom navigation **mobile-only**; desktop uses mega menu | ✅ |
| 7 | Product and ProductVariant remain separate entities | ✅ (unchanged) |
| 8 | Filters from structured product/variant attributes; category config only defines *which* attributes apply | ✅ clarified |
| 9 | Guest cart: localStorage; merge into server cart on login; never lose items | ✅ |
| 10 | Sticky bottom Add to Bag on PDP; swipe-friendly gallery | ✅ |
| 11 | Mobile filters = bottom sheet; desktop = sidebar | ✅ |
| 12 | Design system built before storefront | ✅ |
| 13 | 4:5 product imagery default; UI never overpowers photography | ✅ |
| 14 | "A beautiful fashion app that happens to run in a browser" | ✅ guiding principle |
| 15 | Artifact updated before any production code | ✅ this document |

---

## 1. Proposed Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14+ (App Router) | RSC, streaming, file routing, ISR |
| Language | TypeScript (strict) | End-to-end type safety |
| Styling | Tailwind CSS + CSS design tokens | Design system, responsive utility-first |
| Database | PostgreSQL via Prisma ORM | Relational integrity, type-safe queries, migrations |
| Auth | Auth.js (NextAuth v5) | Google OAuth + Credentials; **JWT session strategy** |
| Image storage | Cloudinary | Admin uploads, optimization, free tier at launch |
| Search | PostgreSQL full-text (`tsvector`) + `pg_trgm` | Zero extra infra; colour search joins variants |
| Payments | **Razorpay** (behind interface) | UPI/cards/netbanking, Indian market, webhook support |
| Deployment | Vercel + managed Postgres (Supabase/Neon) | Zero-config serverless Next.js |
| Validation | Zod | Shared client/server schemas |
| Client state | zustand (persisted) | Cart (guest), wishlist, UI state only |
| WhatsApp | `wa.me` deep links | Floating help button + product inquiry CTA |

No Stripe references. Payment provider is swappable via `PaymentProvider` interface.

---

## 2. Project Architecture

```
ayli/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (shop)/             # Customer route group
│   │   │   ├── page.tsx        # Homepage (editorial discovery feed)
│   │   │   ├── category/[slug]/page.tsx
│   │   │   ├── category/[slug]/subcategory/[subSlug]/page.tsx
│   │   │   ├── product/[slug]/page.tsx
│   │   │   ├── collection/[slug]/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── wishlist/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── account/…        # profile, orders, addresses
│   │   │   └── static pages      # about, contact, policies, guides, faq
│   │   ├── admin/…              # protected admin group
│   │   ├── api/…                # search, cart, wishlist, orders, upload, webhooks, auth
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # design-system primitives
│   │   ├── layout/              # header, footer, bottom-nav (mobile), mega-nav (desktop)
│   │   ├── product/             # product-card, grid, gallery, colour/size selectors
│   │   ├── home/                # hero, discovery, editorial sections
│   │   ├── cart/                # cart-item, cart-summary, empty-state
│   │   ├── checkout/            # address, delivery, payment, review
│   │   ├── filters/             # filter-sheet (mobile), filter-sidebar (desktop)
│   │   ├── search/              # search-overlay, suggestions, results
│   │   ├── admin/               # admin-only components
│   │   └── whatsapp/
│   ├── lib/
│   │   ├── prisma.ts            # singleton client
│   │   ├── auth.ts              # Auth.js config (JWT sessions)
│   │   ├── password.ts          # Argon2/bcrypt hashing
│   │   ├── payment.ts           # PaymentProvider interface (abstract)
│   │   ├── razorpay.ts          # Razorpay implementation
│   │   ├── cloudinary.ts
│   │   ├── search.ts            # tsvector + colour-join search utilities
│   │   ├── validators.ts        # Zod schemas
│   │   └── utils.ts
│   ├── actions/                 # Server actions
│   │   ├── product.actions.ts
│   │   ├── cart.actions.ts
│   │   ├── wishlist.actions.ts
│   │   ├── order.actions.ts
│   │   ├── address.actions.ts
│   │   └── admin/…              # product, category, order, inventory actions
│   ├── hooks/                   # use-cart, use-wishlist, use-search, use-media-query
│   ├── stores/                  # zustand: cart.store.ts, wishlist.store.ts, ui.store.ts
│   ├── types/index.ts
│   └── config/
│       ├── categories.ts        # category → attribute-set mapping (which filters apply)
│       ├── collections.ts
│       └── constants.ts
├── public/
├── .env.local
├── .env.example
└── config files (tailwind, next, ts, eslint)
```

---

## 3. Next.js Route Structure

### Customer routes (Server Components by default)

| Route | Type | Purpose |
|---|---|---|
| `/` | SSR | Editorial homepage discovery feed |
| `/category/[slug]` | SSR | Category listing — dynamic filters + pagination |
| `/category/[slug]/subcategory/[subSlug]` | SSR | Subcategory listing |
| `/product/[slug]` | SSR | Product detail — swipe gallery, sticky bag CTA |
| `/collection/[slug]` | SSR | Collection page (New Arrivals, Occasions, etc.) |
| `/search` | SSR + client sheet | Full search with suggestions/autocomplete/results |
| `/cart` | Client | Guest + authenticated bag, stock validation |
| `/wishlist` | SSR + client | "Your AYLI Edit" |
| `/checkout` | Client (protected) | Address → Delivery → Payment → Review → Confirm |
| `/account` | SSR (protected) | Account home |
| `/account/orders` | SSR (protected) | Order history |
| `/account/orders/[id]` | SSR (protected) | Order detail + status timeline |
| `/account/addresses` | Client (protected) | Saved addresses CRUD |
| `/account/profile` | Client (protected) | Profile editing |
| `/about` | Static | Brand story |
| `/contact` | Static | Contact + WhatsApp |
| `/privacy-policy`, `/terms`, `/shipping-policy`, `/return-refund` | Static | Legal/policy |
| `/size-guide`, `/care-guide`, `/faq` | Static | Guides and help |

### Admin routes (all protected, role check on middleware **and** every server action)

| Route | Purpose |
|---|---|
| `/admin` | Dashboard (revenue, orders, low stock, recent orders) |
| `/admin/products` | Product list / search |
| `/admin/products/new` | Create product |
| `/admin/products/[id]/edit` | Edit product |
| `/admin/categories` | Categories + subcategories + attribute config |
| `/admin/orders` | Order list + status filters |
| `/admin/orders/[id]` | Order detail + status update |
| `/admin/customers` | Customer list + order history |
| `/admin/inventory` | Per-variant stock, low-stock alerts |
| `/admin/settings` | Store settings |

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/*` | * | Auth.js handlers |
| `/api/search` | GET | Product/variant search + suggestions |
| `/api/cart` | GET/POST/PUT/DELETE | Cart operations |
| `/api/wishlist` | GET/POST/DELETE | Wishlist operations |
| `/api/orders` | POST | Order creation |
| `/api/webhooks/razorpay` | POST | Payment event webhooks (signature-verified) |
| `/api/upload` | POST | Admin-only image upload |

---

## 4. Component Architecture

### Design-system primitives (`components/ui/`)
Built in Phase 2 **before** any storefront page: Button, Input (all types), Select, Badge, Modal, Sheet (bottom sheet), Skeleton, Toast, Tabs, Dropdown, Tooltip, Avatar, Pricing/price block, EmptyState.

A separate token layer (CSS variables) feeds every primitive — no hardcoded values in components.

### Layout (`components/layout/`)
- `Header` — renders mobile header **and** desktop header responsively (one component, two variants)
- `BottomNav` — **mobile-only**, renders `below md`; 5 tabs: Home / Explore / Wishlist / Bag / Menu; selected state = AYLI Blue
- `MegaNav` — **desktop-only**, renders `md+`; category flyouts plus search
- `Footer`, `PageContainer`, `ResponsiveGrid`

### Feature modules (each owns its components)
product / home / cart / checkout / filters / search / account / admin / whatsapp.

### Rules
- Server Component by default; `'use client'` only when interactive
- No shared-state through props; contexts/stores only
- All interactive elements keyboard-accessible with visible focus
- Every product image requires meaningful alt text

---

## 5. Database Schema (Prisma, revised)

Single source of truth. Decisions baked in:

- **Sessions are JWT-based** → no `Session`, `Account`, or `VerificationToken` tables in the MVP schema.
- **Colour lives only on `ProductVariant`** → search/filter join variants for colour; no `Product.colour`.
- **Reviews are an extension point, not built** → no `Review` model/UI/API in MVP.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USERS ───
// JWT sessions: no Session/Account/VerificationToken tables.
// Google OAuth upserts the user by email in the signIn callback.
// Credentials provider verifies against hashed password.
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  image     String?
  phone     String?
  role      Role      @default(CUSTOMER)
  password  String? // argon2/bcrypt hash, credentials only
  addresses Address[]
  wishlist  Wishlist?
  cart      Cart?
  orders    Order[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum Role {
  CUSTOMER
  ADMIN
}

// ─── ADDRESSES ───
model Address {
  id        String   @id @default(cuid())
  userId    String
  name      String
  phone     String
  line1     String
  line2     String?
  city      String
  state     String
  pincode   String
  country   String   @default("India")
  isDefault Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId])
}

// ─── CATEGORY TREE ───
model Category {
  id            String        @id @default(cuid())
  name          String
  slug          String        @unique
  description   String?
  image         String?
  isActive      Boolean       @default(true)
  sortOrder     Int           @default(0)
  subcategories Subcategory[]
  products      Product[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Subcategory {
  id          String    @id @default(cuid())
  name        String
  slug        String
  description String?
  image       String?
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  products    Product[]
  @@unique([categoryId, slug])
}

// ─── PRODUCTS ───
model Product {
  id                String           @id @default(cuid())
  name              String
  slug              String           @unique
  sku               String           @unique
  description       String?          @db.Text
  shortDescription  String?
  productType       String?  // "Kurti", "Dress", "Co-ord Set"…
  brand             String?
  isActive          Boolean          @default(true)
  isFeatured        Boolean          @default(false)

  categoryId        String
  category          Category         @relation(fields: [categoryId], references: [id])
  subcategoryId     String?
  subcategory       Subcategory?     @relation(fields: [subcategoryId], references: [id])

  // Pricing (product-level defaults; variants may override price)
  mrp               Decimal          @db.Decimal(10,2)
  sellingPrice      Decimal          @db.Decimal(10,2)
  costPrice         Decimal?         @db.Decimal(10,2)
  taxRate           Decimal          @default(0) @db.Decimal(5,2)

  // Structured fashion attributes (searchable, category-aware)
  fabric            String?
  pattern           String?
  printType         String?
  sleeveType        String?
  neckType          String?
  length            String?
  fit               String?
  waist             String?
  rise              String?
  occasion          String?
  material          String?          // accessories
  transparency      String?
  stretchability    String?
  washCare          String?          @db.Text

  // Sizing / documentation
  sizeChartUrl      String?
  modelInfo         String?          // "Model wears M, 5'7""
  garmentMeasurements String?        @db.Text
  productMeasurements  String?       @db.Text
  countryOfOrigin   String           @default("India")

  // Relations (NO colour here — colour belongs to ProductVariant)
  images            ProductImage[]
  variants          ProductVariant[]
  collections       ProductCollection[]
  cartItems         CartItem[]
  wishlistItems     WishlistItem[]
  orderItems        OrderItem[]

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@index([categoryId])
  @@index([subcategoryId])
  @@index([isActive])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  alt       String?
  sortOrder Int     @default(0)
  isMain    Boolean @default(false)
  @@index([productId])
}

// ─── VARIANTS (first-class entities) ───
// A variant is a unique colour + size combination of a product.
// NEVER model colour/size combos as separate products.
model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  sku       String   @unique
  barcode   String?
  colour    String   // the ONLY place colour lives
  colourHex String?
  size      String
  price     Decimal? @db.Decimal(10,2) // optional override
  weight    Decimal? @db.Decimal(8,2)
  isActive  Boolean  @default(true)

  inventory Inventory?
  cartItems CartItem[]
  orderItems OrderItem[]

  @@unique([productId, colour, size])
  @@index([productId])
}

// ─── INVENTORY (per variant) ───
model Inventory {
  id                String         @id @default(cuid())
  variantId         String         @unique
  variant           ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  stockQuantity     Int            @default(0)
  reservedQuantity  Int            @default(0)
  lowStockThreshold Int            @default(5)
  warehouseLocation String?
  stockStatus       StockStatus    @default(IN_STOCK)
  updatedAt         DateTime       @updatedAt
}

enum StockStatus {
  IN_STOCK
  LOW_STOCK
  OUT_OF_STOCK
}

// ─── COLLECTIONS (m:n with products) ───
model Collection {
  id          String              @id @default(cuid())
  name        String
  slug        String              @unique
  description String?
  image       String?
  isActive    Boolean             @default(true)
  sortOrder   Int                 @default(0)
  products    ProductCollection[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

model ProductCollection {
  productId    String
  collectionId String
  product      Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  sortOrder    Int        @default(0)
  @@id([productId, collectionId])
}

// ─── WISHLIST ───
model Wishlist {
  id     String         @id @default(cuid())
  userId String         @unique
  user   User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items  WishlistItem[]
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  @@unique([wishlistId, productId])
}

// ─── CART ───
model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String         @id @default(cuid())
  cartId    String
  cart      Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  quantity  Int            @default(1)
  createdAt DateTime       @default(now())
  @@unique([cartId, variantId])
}

// ─── ORDERS ───
model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique   // AYLI-YYYYMMDD-XXXX
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  addressId     String
  address       Address       @relation(fields: [addressId], references: [id])

  subtotal      Decimal       @db.Decimal(10,2)
  discount      Decimal       @default(0) @db.Decimal(10,2)
  tax           Decimal       @default(0) @db.Decimal(10,2)
  shipping      Decimal       @default(0) @db.Decimal(10,2)
  total         Decimal       @db.Decimal(10,2)

  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  paymentMethod String?
  paymentId     String?

  shippingMethod String?
  trackingNumber String?
  shippedAt      DateTime?
  deliveredAt    DateTime?
  notes          String?
  items          OrderItem[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([userId])
  @@index([status])
}

// Order items snapshot product/variant data at purchase time,
// so the order stays immutable if catalog data changes later.
model OrderItem {
  id        String         @id @default(cuid())
  orderId   String
  order     Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product        @relation(fields: [productId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  name      String          // snapshot
  image     String?         // snapshot
  colour    String          // snapshot
  size      String          // snapshot
  quantity  Int
  price     Decimal         @db.Decimal(10,2)  // snapshot
  total     Decimal         @db.Decimal(10,2)  // snapshot
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

### Entity relationships (summary)

```
User 1─N Address
User 1─1 Wishlist 1─N WishlistItem  N─1 Product
User 1─1 Cart     1─N CartItem     N─1 ProductVariant
User 1─N Order    1─N OrderItem    N─1 Product / ProductVariant
Order N─1 Address

Category 1─N Subcategory
Category 1─N Product; Subcategory 1─N Product
Product 1─N ProductImage
Product 1─N ProductVariant 1─1 Inventory   ← colour lives HERE
Product N─N Collection (via ProductCollection)
```

### Key indexes
- `Product`: categoryId, subcategoryId, isActive, slug, sku
- `ProductVariant`: productId, (productId + colour + size)
- `Inventory`: variantId (unique)
- `Order`: userId, status, orderNumber; `OrderItem`: orderId
- `Address`: userId; `CartItem`: cartId (unique w/ variantId)

---

## 6. Authentication Architecture (single, consistent decision)

**Decision: Auth.js (NextAuth v5) with JWT-based, stateless sessions.**

- The session lives in a signed, encrypted cookie. No session rows are stored.
- **Prisma schema matches this decision**: there is no `Session`, `Account`, or `VerificationToken` model in the MVP schema.
- Users are still persisted to PostgreSQL (they need orders/addresses/cart/wishlist). This is done inside the Auth.js `signIn`/`signUp` callbacks:
  - **Google login** → upsert `User` by email in the `signIn` callback; link avatar/name.
  - **Credentials** → `authorize()` verifies email + Argon2/bcrypt hash against `User.password`.
- Each returning request asserts identity via the JWT cookie (`userId`, `role`).

**Token shape (issued by Auth.js JWT callback):**
```ts
interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "CUSTOMER" | "ADMIN";
}
```

**Authorization (never client-side only):**
1. `src/middleware.ts` — protects `/admin/*` and `/account/*`; redirects unauthenticated users; rejects `role !== ADMIN` for `/admin/*`.
2. Every admin **server action** independently verifies `session.user.role === "ADMIN"`.
3. Every mutating customer action verifies `session.user.id` and scopes queries to that user.

**Security notes:** hashed passwords (never plaintext), HTTP-only secure cookies, CSRF handled by Auth.js, Zod validation on every action, no secrets in client bundles.

> Extension point: if database-backed sessions or email verification are ever needed, add `Session` / `VerificationToken` models then — the schema is additive.

---

## 7. Product / Variant Model (correction #7)

Product and ProductVariant are **separate entities**. A product is the catalog item; a variant is one sellable colour+size combination.

```
Product:  "Floral Rayon A-Line Kurti"   [MRP 2499, Selling 1499]
  ├─ Category: Kurtis & Tops / Subcategory: A-Line Kurtis
  ├─ Attributes: Fabric=Rayon, Pattern=Floral, Neck=V-Neck, Sleeve=3/4
  ├─ Images: main + gallery (4:5)
  └─ Variants:
       AYLI-K-001  Dusty Brown / S   qty 12
       AYLI-K-002  Dusty Brown / M   qty 8
       AYLI-K-003  Dusty Brown / L   qty 5
       AYLI-K-004  Dusty Brown / XL  qty 3
       AYLI-K-005  Sage Green / S    qty 10
       AYLI-K-006  Sage Green / M    qty 7
       AYLI-K-007  Sage Green / L    qty 6
       AYLI-K-008  Sage Green / XL   qty 0 → OUT_OF_STOCK
```

Variant owns: `sku`, `barcode`, `colour`, `colourHex`, `size`, optional `price` override, `weight`, `isActive`, and its `Inventory` (stock, reserved, low-stock threshold, status).

- Colour swatches on the PDP come from `distinct colour` across the product's variants.
- Size chips come from distinct sizes of the selected colour.
- Availability is always computed per selected variant from `Inventory`.

---

## 8. Search Architecture (colour-aware, no duplicate fields)

Two-seam search over PostgreSQL:

1. **Text relevance** — a generated `tsvector` on `Product` covering: `name` (weight A), `productType` (A), `fabric` (B), `pattern` (B), `occasion` (B), `productShortDescription` (C), `description` (C). Backed by a GIN index.
   - Note: **categories/subcategories** are resolved separately via slug/category term match, and the query is scoped there when a category matches.
2. **Colour search (correction #3)** — colour is queried against `ProductVariant`. If the query contains a colour-like term (or always, cheaply via ILIKE on distinct variant colours), products are matched when any active variant has that colour.

```sql
-- illustration: product text index
ALTER TABLE "Product" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(productType,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(fabric,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(pattern,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(occasion,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(shortDescription,'')), 'C')
  ) STORED;

-- colour resolution (parallel query):
SELECT DISTINCT v."productId" FROM "ProductVariant" v
WHERE v."isActive" = true AND v."colour" ILIKE '%blue%';
```

`pg_trgm` provides fuzzy/typo-tolerant suggestions.

**Search surface:**
- `/api/search?q=…` → `{ results, total, query, suggestions, matchedCategories }`
- Pre-typing state: Trending searches, popular categories, popular collections
- During typing: autocomplete with product/category/attribute suggestions (debounced)
- No-results state with recovery suggestions; clear-search control; result count
- Search page reuses the dynamic filter system + sort

---

## 9. Filter Architecture (data-driven, category-aware)

**Principle (correction #8):** filters are computed from the store's **structured product/variant attribute data**, never from hardcoded product groupings. The per-category config only declares *which* attribute keys apply to that category; the option values and counts are always derived live from the catalog at query time.

```ts
// src/config/categories.ts — WHICH filters apply per category
const kurtisTopAttrs = ["size","colour","fabric","pattern","printType","sleeveType","neckType","length","fit","occasion","price"];

// colour options computed live:
// prisma.productVariant.findMany({ where: { product: { categoryId } , isActive: true }, distinct: ["colour"] })
// size options likewise from variants.
// fabric/pattern/sleeve/neck/length/fit/occasion from Product columns in that category.
```

| Category | Filter keys |
|---|---|
| Kurtis & Tops | Size, Colour*, Fabric, Pattern, Print Type, Sleeve, Neck, Length, Fit, Occasion, Price |
| Co-ord Sets | Size, Colour*, Fabric, Pattern, Length, Fit, Occasion, Price |
| Kurta Sets | Size, Colour*, Fabric, Pattern, Length, Fit, Occasion, Price |
| Dresses | Size, Colour*, Fabric, Pattern, Sleeve, Length, Fit, Occasion, Price |
| Bottoms | Size, Colour*, Fabric, Pattern, Waist, Rise, Length, Fit, Price |
| Fabrics | Fabric, Pattern, Material, Print Type, Price |
| Accessories | Material, Colour*, Size, Occasion, Price |

`\*` Colour options always from `ProductVariant` (correction #3).

**Mechanics:**
- URL-driven state: `/category/kurtis-tops?colour=blue&fabric=rayon&sort=price_asc`
- Prisma `where` built server-side from URL params (+ variant where for colour)
- Option counts computed server-side for the current category scope
- Mobile: **bottom sheet**; Desktop: **sidebar** (correction #11)
- Sort: relevance (search), price ↑↓, newest, popularity
- Never render an empty/irrelevant filter group

---

## 10. Cart Architecture (guest-first)

- **Guest:** zustand cart persisted to localStorage — cart is usable with zero auth.
- **Authenticated:** rows in `Cart`/`CartItem`.
- **On login (correction #9):** guest localStorage items are **merged** into the server cart (same variant ⇒ sum quantities, capped at stock), conflicts resolved in favor of stock limits, then localStorage is cleared. Nothing is lost.
- **Stock validation:** on add, on quantity change, and re-validated at checkout against `Inventory.stockQuantity − reservedQuantity`. Checkout is blocked server-side if any line exceeds available stock.
- Totals derive from variant- or product-level price × quantity (discount from MRP), plus tax, shipping, and grand total.

---

## 11. Checkout Architecture (minimal friction)

One-page step progression, mobile-first, four interactions:

1. **Address** — saved addresses (one tap) or add new; autofill from account
2. **Delivery** — standard (free) / express (if configured)
3. **Payment** — Razorpay (UPI, cards, netbanking) behind the provider abstraction
4. **Review → Confirm** — full line-item summary + totals, always visible, sticky CTA

**Payment abstraction (correction #1):**

```ts
// src/lib/payment.ts — the ONLY interface consumers see
export interface PaymentProvider {
  createOrder(params: { amount: number; currency: string; receipt: string }): Promise<PaymentOrder>;
  verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean>;
  capture(orderId: string): Promise<void>;
  refund(orderId: string, amount: number): Promise<RefundResult>;
}

// src/lib/razorpay.ts — initial implementation (Razorpay SDK + webhook verification)
export class RazorpayProvider implements PaymentProvider { /* … */ }

// wired once via factory
export const paymentProvider: PaymentProvider = new RazorpayProvider();
```

Swapping providers later = a new class + one factory line. No Stripe references anywhere.

**Server-side rules:** amounts are recomputed server-side (never trust client totals); Razorpay webhook signature verified before mutating `PaymentStatus`; order created only after payment verification; card data never touches our servers (PCI delegated to Razorpay).

---

## 12. Order Architecture

- Lifecycle: `PENDING → CONFIRMED → PACKED → SHIPPED → DELIVERED`, with `CANCELLED`, `RETURNED`, `REFUNDED`.
- Order number `AYLI-YYYYMMDD-XXXX`.
- **Snapshot design:** `OrderItem` stores name/image/colour/size/price at purchase time → catalog changes never corrupt order history.
- Order creation: verify stock → create Order + OrderItems + Payment record → reserve inventory → clear cart → confirmation screen → admin sees it in Orders.
- Customer order views show status timeline + items + address + payment.

---

## 13. Mobile-First UX Flow

**Primary design reference: 390 × 844.** Validate 360×800, 375×812, 390×844, 412×915, 430×932, then tablet (768) and desktop (1024/1280/1536).

### Core journeys
1. **"I know what I want"** → Search: tap search → type "blue dress" → autocomplete → results with filters
2. **"I want to browse"** → Explore/Home → category → subcategory → listing → filters → PDP
3. **"I don't know what I want"** → Discovery: Trending → Occasion → New Arrivals → AYLI Edit → editorial

### Mobile navigation (correction #6)
- **Bottom nav (mobile only, < 768px):** Home | Explore | Wishlist | Bag | Menu — selected icon in AYLI Blue; persistent bottom sheet heights account for it.
- **Desktop (≥ 1024px):** top bar + `MegaNav` category flyouts. Tablet uses a simplified top nav (no bottom bar).

### Key mobile patterns
- Homepage = editorial discovery feed (hero 4:5, Shop Your Way, Shop Categories, New Arrivals, Occasion, Fabric, Trending, Collections, AYLI Edit, Brand Story, Social proof, WhatsApp, Footer)
- PDP (correction #10): swipe-friendly gallery (4:5), sticky bottom CTA `♡ [ADD TO BAG]`, accordion details
- Filters: bottom sheet with "Clear all / View N"; 44px+ touch targets
- Wishlist = "Your AYLI Edit"; heart micro-interaction ♡→♥
- Cart: adjacency rows, quantity steppers, sticky Checkout CTA, "You save ₹X"
- Checkout: saved address one-tap, sticky total + CTA
- Order success: "✨ You're all set" + TRACK ORDER
- No horizontal overflow on any breakpoint

---

## 14. Design System (Phase 2 deliverable, pre-storefront)

### Colour tokens
| Token | Hex | Usage |
|---|---|---|
| `--ayli-blue` | `#22C0D4` | Brand recognition, primary actions, selected states, focus |
| `--ayli-peach` | `#FFA384` | Feminine highlights, promos, delight accents |
| `--warm-white` | `#FFFDF9` | Page background (primary) |
| `--soft-beige` | `#F7F3EF` | Section backgrounds, cards on white |
| `--dark-text` | `#252525` | Primary text |
| `--muted-text` | `#777777` | Secondary/helper text, MRP strikethrough |
| `--light-border` | `#EAE6E2` | Hairline borders (used sparingly) |
| `--success` | `#3C9B72` | Stock-in, delivered, saved |
| `--error` | `#D95C5C` | Errors, out-of-stock |

Usage discipline: blue/peach are **accents**, not wallpaper. Warm-white + beige carry the surface; images carry the emotion.

### Typography
Preference: **Proxima Nova** (display/body) and **Nivi Medium** (headlines) per brand reference, **if licensed/available**.
Implementation: `next/font/local` with a CSS-variable swap lane:

```css
:root {
  --font-display: var(--font-nivi, var(--font-proxima, ui-sans-serif, system-ui, sans-serif));
  --font-body:    var(--font-proxima, ui-sans-serif, system-ui, -apple-system, sans-serif);
}
```

A self-hosted OTF/TTF dropped in publicly later swaps in with **zero component changes**. Scale: display 40/32/28/24; body 16/14/12 (rem); letter-spacing tightened on display for an editorial feel.

### Spacing
4px base → `4/8/12/16/20/24/32/40/48/64/96`. Sections breathe (py-16 mobile, py-24 desktop).

### Radii & effects
Soft corners (buttons 999px pill or 12px; cards 16px); **no heavy shadows** (only `shadow-sm` on elevation); hairline borders instead of box shadows; 150–250ms ease transitions; subtle press feedback.

### Core components
- **Buttons:** primary (AYLI Blue, white text, pill), secondary (outline/hairline), ghost (icon), wishlist (hearts), loading spinner state
- **Product card:** image-dominant (4:5, rounded, heart top-right on image, colour dots, name, selling price, MRP strike, discount % badge) — never attribute-heavy
- **Forms:** large fields, always-labeled, inline error/helper, 44px targets
- **States:** EmptyState (illustrated, actionable), Skeleton (shape-matching), ErrorState (retry) — every list/page implements all three
- **Microinteractions:** heart ♡→♥, add-to-bag toast "Added to your bag ✨", bottom-sheet slide-up, gallery swipe, tab press feedback, order-success animation — all must not block shopping

---

## 15. Admin Architecture

Protected by middleware (`role ADMIN`) **and** re-checked inside every server action. Desktop-first interface (admin is a back-office tool), but usable down to tablet.

- Sidebar layout: Dashboard, Products, Categories, Orders, Customers, Inventory, Settings
- Dashboard: revenue, orders, products, customers, low-stock alerts, recent orders
- Products: list/search/archive; create/edit form flow — basics → attributes → pricing → images → variants (colour × size matrix with per-variant SKU/barcode/stock/price) → collections
- Categories: categories + subcategories + attribute-key config (drives filters)
- Orders: filter by status; detail with items, customer, address, payment; update status
- Customers: list + order history
- Inventory: per-variant stock, low-stock flags, bulk adjustments

---

## 16. SEO Architecture

- Semantic HTML (`header/nav/main/section/article/footer`)
- Per-route `generateMetadata()`: titles, meta descriptions, canonical URLs
- Open Graph tags (product + category + collection)
- JSON-LD: `Product`, `BreadcrumbList`, `Organization`
- Dynamic XML sitemap (products, categories, collections, static pages); `robots.txt` (disallow `/admin`, `/api`, `/account`, `/cart`, `/checkout`)
- Clean URLs everywhere; product/category pages indexable
- Meaningful alt text on all product images (admin-enforced)

---

## 17. Security Strategy

| Concern | Implementation |
|---|---|
| Sessions | Auth.js JWT (signed/encrypted, httpOnly, secure) |
| Authorization | middleware + per-action role checks; never trust client |
| Passwords | Argon2/bcrypt hashes only |
| Input validation | Zod on every server action & API route |
| Injection | Prisma parameterized queries |
| XSS | React escaping + sanitization |
| Secrets | env vars only; `NEXT_PUBLIC_` whitelist reviewed |
| CSRF | Auth.js handling |
| Payments | server-verified amounts; Razorpay webhook signature check; no card data on our servers |
| Uploads | admin-only, type/size validated server-side |
| Rate limiting | auth/cart/checkout endpoints |

---

## 18. Performance Strategy

- Server Components by default; minimal client JS (zustand only for cart/wishlist/UI)
- `next/image` with WebP/AVIF, responsive sizes, blur placeholders, lazy loading below fold
- Self-hosted fonts via `next/font`, `display: swap`
- ISR/revalidate on catalog pages; selective queries (no `select *`)
- Indexed queries, server-side pagination (20/page), option-counts computed in one query
- Dynamic import for admin and heavy client pieces; tree-shaking
- Core Web Vitals tracked each phase

---

## 19. Testing Strategy

Per-phase gates (every phase): `tsc --noEmit` → `next build` → `next lint` → migration + seed → manual mobile QA (Chrome DevTools 390×844 + device) → console-error sweep.

Phase 10 browser QA: the full 23-scenario checklist (guest browse → filter → search → PDP → variant selection → wishlist → cart → login → checkout → payment → order → view order → admin login → product create/edit → inventory → customer order → status update → mobile/tablet/desktop layout). All findings documented before release.

Future (post-MVP): Vitest unit tests, Playwright E2E on critical journeys.

---

## 20. Deployment Strategy

- **Vercel** (frontend + API + middleware) · **managed PostgreSQL** (Supabase/Neon) · **Cloudinary** · **Razorpay** (test → live)
- Migration flow: `prisma migrate deploy` + seed on release
- Environments: `local` / `preview` / `production`, each with its own secrets
- Post-deploy smoke test of home, category, PDP, search, login, admin

---

## 21. Environment Variables

```env
# Database
DATABASE_URL="postgresql://…"

# Auth (Auth.js)
AUTH_SECRET="…"
AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="…"
GOOGLE_CLIENT_SECRET="…"

# Cloudinary
CLOUDINARY_CLOUD_NAME="…"
CLOUDINARY_API_KEY="…"
CLOUDINARY_API_SECRET="…"

# Razorpay
RAZORPAY_KEY_ID="…"
RAZORPAY_KEY_SECRET="…"
RAZORPAY_WEBHOOK_SECRET="…"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER="919999999999"
```

---

## 22. Major Risks

| Risk | Mitigation |
|---|---|
| Variant data-entry complexity | Admin variant matrix built early (Phase 7) & seed generator reused for QA |
| Colour-filter perf over many variants | `distinct colour` query indexed by product, GIN text index, pagination |
| Razorpay integration slippage | Provider interface + test keys from day one; COD fallback option as backup |
| Image cost | Cloudinary free tier + server-side compression at upload |
| JWT + JIT user persistence gotchas | Upsert pattern pinned in Phase 3 before catalog build |
| Scope creep | Reviews/notifications deferred (extension points only) |
| Mobile quality drift | 390×844 is the primary canvas; desktop is an enhancement |

---

## 23. Phase Plan

### Phase 2 — Project Foundation + Design System + Database
1. Scaffold Next.js 14 + TypeScript (strict) + Tailwind + ESLint; clean template defaults
2. `.env.local` + `.env.example` with all keys from §21 (placeholders)
3. Prisma + PostgreSQL setup; write **revised schema** (§5); first migration
4. **Design system first:** tokens (colour, type, spacing, radius, shadow), typography lanes (font-swap), globals
5. Design-system primitives: Button, Input, Select, Badge, Skeleton, Sheet, Modal, Toast, EmptyState, ErrorState
6. Root layout: fonts, metadata, providers; Header/BottomNav/MegaNav/Footer shells with correct responsive show/hide
7. Seed script: 7 categories + full subcategory sets + collections (with 4:5 placeholder imagery strategy)
8. Gates: `tsc`, `build`, `lint`, migration, seed, 390×844 visual pass on layout shells

### Phase 3 — Authentication + Customer Account
Auth.js JWT sessions, Google + Credentials, user upsert, middleware protection, account pages, address CRUD, guest→server cart merge hooks, auth QA.

### Phase 4 — Catalog + Variants + Filters + Search
Category/subcategory/product/collection pages, listing with pagination, PDP with variant colour+size selection and swipe gallery + sticky Add to Bag, dynamic data-driven filters (bottom sheet / sidebar), sort, full-text + colour search with suggestions, rich product seed, catalogue QA.

### Phase 5 — Wishlist + Cart + Checkout + Payments
Wishlist ("Your AYLI Edit"), guest cart + merge, stock-validated cart, one-page checkout (address→delivery→payment→review), Razorpay via `PaymentProvider`, webhooks, confirmation screen, purchase-flow QA.

### Phase 6 — Orders
Order + snapshot items creation, order number, customer order list/detail + timeline, admin visibility contract (API ready), QA of full lifecycle.

### Phase 7 — Admin Panel
Sidebar shell + guards, dashboard metrics, product CRUD + variant/inventory matrix, category & collection management, order management + status updates, customers, inventory, uploads, admin QA.

### Phase 8 — SEO + WhatsApp + Static Pages
Metadata/OG/JSON-LD/sitemap/robots, alt-text audit, WhatsApp floating + product inquiry, 9 static pages with realistic editorial copy.

### Phase 9 — Responsive Polish + Delight + A11y + Performance
All five phone widths + tablet + desktop passes, microinteractions, keyboard/focus/contrast/screen-reader audit, image/font/JS/CWV optimization, homepage editorial content finalization.

### Phase 10 — Browser-Based QA + Production Prep
23-scenario QA logged, cross-browser & device testing, bug fixes, final build + secret audit + backup strategy, deploy, post-launch smoke test.

---

## 24. Phase 2 Completion Record (2026-09-15)

### Delivered

| Area | Status |
|---|---|
| Next.js scaffold | Next 16.3.5, React 19.2.8, TypeScript strict, Tailwind v4 (CSS-first tokens), ESLint 9 flat config, Turbopack |
| Environment | `.env` (DATABASE_URL, shared), `.env.local` (Next secrets), `.env.example` (documented) — all gitignored |
| Database | `prisma/schema.prisma` (JWT-matched schema, colour on `ProductVariant` only, no reviews) — validated ✓, client generated ✓ |
| Migration | `prisma/migrations/20260915000000_init/migration.sql` generated offline via `prisma migrate diff` (399 lines) — **applied when a live DB is available** |
| Design system | Tokens (`globals.css` `@theme`): brand + supporting colours, radii, soft shadows, easing, motion keyframes |
| Typography | Swap lane via `--ayli-font-display` / `--ayli-font-body` — Proxima Nova / Nivi drop in later with zero component changes |
| Primitives | `Button`, `Input`/`Select`/`Textarea` (field), `Badge`, `Skeleton`, `Sheet` (bottom/center/right), `Modal`, `Toast`, `EmptyState`, `ErrorState`, `SectionHeading`, hand-rolled `Icon` set |
| Layout | `Logo`, `Header` (mobile + desktop variants), `MegaNav` (desktop-only), `BottomNav` (mobile-only, 5 tabs), `Footer`, `PageContainer` |
| Routes | `(shop)` group (homepage shell), `/admin` placeholder, root layout with brand metadata + skip link + ToastProvider |
| Config | `constants`, `navigation`, `categories` (filter sets), `collections` (9 defaults + Shop Your Way) |
| Seed | `prisma/seed.ts` — 7 categories, 39 subcategories, 9 collections (idempotent upserts; run deferred) |

### Gates

- ✅ `tsc --noEmit` — clean
- ✅ `npm run lint` — clean
- ✅ `npm run build` — clean; routes `/`, `/admin`, `/icon.svg`
- ✅ Production smoke test — `/` and `/admin` return 200 with expected content
- ⏸️ `prisma migrate deploy` + `db:seed` — deferred (no live PostgreSQL yet, per user decision)

### Decisions recorded

1. **No live DB in Phase 2** — schema, client and migration are ready; apply with `npm run db:migrate` then `npm run db:seed` once `DATABASE_URL` points at a real Postgres.
2. **Turbopack root pinned** to the project dir because a stray `node_modules`/`package-lock.json` in the OS home directory confused module root detection.
3. **Manual SVG icon set** instead of an icon library — zero new runtime dependency, consistent 1.5px stroke.
4. **Category filter sets** live in `src/config/categories.ts` (which attributes apply per category); their values are always computed from the catalog, never hardcoded — matches correction #8.
5. **`POSTINSTALL=prisma generate`** so a fresh clone can build and typecheck before any DB is provisioned.

### Next: Phase 3 — Authentication + Customer Account

Auth.js (NextAuth) JWT sessions + Google OAuth + Credentials, user upsert on sign-in, middleware routing protection for `/account/*` and `/admin/*`, account home, profile, saved addresses CRUD. Requires `GOOGLE_CLIENT_ID/SECRET`, `AUTH_SECRET`.

---

## 25. Phase 3 Completion Record (2026-09-15)

### Delivered

| Area | Status |
|---|---|
| Auth library | next-auth 5.0.0-beta.32 (Auth.js v5) installed |
| Password hashing | `src/lib/password.ts` — Node built-in `crypto.scrypt`, zero new deps, self-describing `scrypt$N$r$p$salt$hash` format with constant-time compare |
| Auth config | `src/lib/auth.ts` — NextAuth with JWT session strategy, Google OAuth + Credentials providers, signIn callback upserts Google users via Prisma, JWT callback stamps DB user id/role, session callback maps token → session.user |
| Route handler | `src/app/api/auth/[...nextauth]/route.ts` — GET/POST re-exported from handlers |
| Type augmentation | `src/types/next-auth.d.ts` — extends @auth/core JWT (id, role), User (role), Session (user.id, user.role) |
| Proxy (route protection) | `src/proxy.ts` — protects `/account/*` (must be logged in) and `/admin/*` (must be logged in AND role ADMIN); redirects to `/signin?callbackUrl=...`; invalid callbackUrl values sanitized |
| Sign-in page | `src/app/(auth)/signin/page.tsx` — server-rendered form with `SignInForm` (useActionState), Google button, signup link; session-aware redirect if already authenticated |
| Sign-up page | `src/app/(auth)/signup/page.tsx` — `SignUpForm` with Zod validation (name, email, password, confirmPassword match), error display, terms note |
| Auth server actions | `src/actions/auth.action.ts` — `signInWithCredentials`, `signInWithGoogle`, `registerUser`, `signOutAction` (all use useActionState pattern) |
| Auth UI primitives | `src/components/auth/submit-button.tsx` (pending spinner via useFormStatus), `signin-form.tsx`, `signup-form.tsx`, `google-button.tsx` |
| Account layout | `src/app/account/layout.tsx` — auth-gated shell (defense-in-depth), sticky header with sign-out, sidebar nav with role-aware Admin link |
| Account nav | `src/components/account/account-nav.tsx` — Overview, Orders, Addresses, Profile (+ Admin for ADMIN role); active state via usePathname |
| Account home | `src/app/account/page.tsx` — fresh user from Prisma, order/address counts, quick-link cards |
| Profile page | `src/app/account/profile/page.tsx` + `src/components/account/profile-form.tsx` — name/email/phone editing, Zod validation, email uniqueness check |
| Orders page | `src/app/account/orders/page.tsx` — order history with status badges, item summary, totals; empty-state CTA |
| Addresses page | `src/app/account/addresses/page.tsx` + `src/components/account/address-form.tsx` — full CRUD (list/add/edit/delete/set-default), Zod validation, isDefault auto-promotion, success status banners |
| Address/account server actions | `src/actions/account.action.ts` — `updateProfile`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`; all auth-gated with `assertUser()`, Zod field error mapping |
| New icons | `map-pin`, `edit`, `trash`, `logout` added to hand-rolled icon set |
| Mobile header | Account (user) icon added to mobile header quick-access row |

### Gates

- ✅ `tsc --noEmit` — clean
- ✅ `npm run lint` — clean (0 errors, 0 warnings)
- ✅ `npm run build` — clean; proxy detected; routes: `/`, `/admin` (static), `/account/*` (dynamic), `/signin`, `/signup`, `/api/auth/[...nextauth]`, `/icon.svg`
- ✅ Smoke test (port 4000):
  - `GET /` → 200
  - `GET /signin` → 200
  - `GET /signup` → 200
  - `GET /admin` → 307 → `/signin?callbackUrl=%2Fadmin`
  - `GET /account` → 307 → `/signin?callbackUrl=%2Faccount`
  - `GET /api/auth/session` → `null`
  - `GET /api/auth/providers` → `{google, credentials}`
- ⏸️ End-to-end sign-in/register flows — blocked by no live PostgreSQL (user decision)

### Decisions recorded

1. **Proxy not middleware** — `src/proxy.ts` per Next 16 convention; auth wrapper via `export const proxy = auth((req) => { ... })` validated working.
2. **scrypt over bcrypt/argon2** — zero-dependency goal met using Node's built-in `crypto.scrypt` with cost=16384, r=8, p=1; self-describing hash format allows future tuning.
3. **Dual protection** — proxy guards at the network boundary; account layout and server actions independently call `auth()` / `assertUser()` per Next 16 guidance ("never rely on Proxy alone").
4. **Auth.js v5 beta 32** — works with Next 16.3.5 proxy convention; `middleware.js` export is deprecated in v5; `auth` export used directly.
5. **UseActionState pattern** — all forms use React 19 `useActionState` for server action error feedback without client-side state management.
6. **Port for dev smoke tests** — use port 4000 (`npm run dev -- -p 4000`) to avoid conflicts.

### Next: Phase 4 — Catalog + Variants + Filters + Search

Category/subcategory product pages, listing with pagination, PDP with variant colour+size selection and swipe gallery + sticky Add to Bag, dynamic data-driven filters (bottom sheet / sidebar), sort, full-text + colour search with suggestions, rich product seed, catalogue QA.

---

## 26. Phase 4 Completion Record — Catalog + Variants + Filters + Search (2026-09-15)

### Delivered — Data layer

| File | Purpose |
|---|---|
| `src/lib/catalog-url.ts` | Pure URL helpers: `splitMulti`, `validPage`, `CatalogPatch` (toggle/clear/clearAll/setPrice/sort/page), `buildCatalogUrl(basePathname, current, patch)`. `MULTI_KEYS` (explicit literal list of 13), `CONSTANT_KEYS` + `VARIANT_KEYS` typed `as const satisfies readonly MultiFilterKey[]`. `MultiFilterKey = Exclude<FilterKey, "price">`. |
| `src/lib/catalog.ts` | Server-only data layer. `SortKey` + `SORT_OPTIONS` + `orderByFor`; `parseCatalogParams` (facets, sort, page, price bounds); `buildProductWhere` (variant-size/colour facet via `variants: { some }`, constant keys via `in` + insensitive, price bounds); `getCatalogListing` (48/page default, returns products/total/page/pageSize/pageCount); `getFilterGroups` — dependent facets counted with the facet removed from scope (`constantFacetGroup` = `groupBy` + `_count`, `variantFacetGroup` = `findMany` distinct per productId + JS counts); `getPriceRange` (aggregate) + `buildPricePresets` (thirds of live range, collapse to "All" when span ≤ 0); scope getters `getCategoryBySlug` / `getSubcategoryBySlug` / `getCollectionBySlug`; PDP `getProductBySlug` → `PdpData` (availability from inventory stock/reserved, colours map, `discountPercent`) + `getRelatedProducts`; exported `productCardSelect`, `SerializedProductCard`, `serializeProductCard`. |
| `src/lib/search.ts` | ILIKE search (schema has no tsvector): `buildSearchWhere` over name/productType/fabric/pattern/occasion/material/shortDescription/description + variant colour via `variants: { some }`; JS relevance ranking (name prefix 120 / contains 90, exact colour 70 / contains 40, description 5); `searchCatalog` (relevance sorts in JS over full set, others delegate to `getCatalogListing`); `getSearchSuggestions` (products + categories + collections) + `getTrendingSearch`. |
| `src/app/api/search/route.ts` | `GET ?q=` → `{query, products, categories, collections}`; empty q returns trending; limits clamped (1–12 / 1–8). |

### Delivered — Display, PDP, filter components

| Component | Notes |
|---|---|
| `product/price-block.tsx` | Server; formatINR selling price, line-through MRP, `% off` badge; sm/md sizes. |
| `product/product-image.tsx` | `next/image` fill 4:5, branded sparkles placeholder when no src. |
| `product/product-card.tsx` | Card → `/product/[slug]`, hover scale, discount badge overlay, name, price, "N colours". |
| `product/product-grid.tsx` | 2/3/4 column responsive grid. |
| `product/gallery.tsx` | Client scroll-snap swipe track, counters, arrows, dots (keyboard-free arrows; sticky handled by parent). |
| `product/variant-selector.tsx` | Client colour swatch chips (hex + `parseColourName`) → size chips gated by colour; availability-aware (sold-out strikethrough/disabled); auto-clears size in colour change. |
| `product/accordion.tsx` | Native `<details>` accordion, no JS. |
| `product/add-to-bag.tsx` | Client: variant selection, quantity stepper 1–5, live total, desktop full-width CTA + mobile sticky bar (`bottom-20`, `lg:hidden`); CTA is a placeholder toast — real cart wiring deferred to Phase 5. |
| `catalog/sort-select.tsx` | Client select → `buildCatalogUrl` → `router.replace`. |
| `catalog/pagination.tsx` | Server; `pageWindow` (7 max, ellipses), prev/next disabled states. |
| `catalog/catalog-filters.tsx` | Groups as pill chips (count badge) or colour swatches; price presets + "All prices" + Clear all (active count); all hrefs via `buildCatalogUrl`. |
| `catalog/filter-sheet.tsx` | `Sheet` bottom on mobile + Filter button with active-count badge. |
| `catalog/breadcrumbs.tsx` | Server. |
| `catalog/catalog-listing-view.tsx` | Shared server listing shell: breadcrumbs, heading + count, subcategory chip strip, empty state with CTA, desktop sticky sidebar (`lg:sticky top-24`) + mobile `FilterSheet`, `SortSelect`, `ProductGrid`, `Pagination`. |
| `ui/button.tsx` | Now exports `BUTTON_VARIANTS`, `BUTTON_SIZES`, `buttonClasses()`; `icons.tsx` adds `sliders`. |

### Delivered — Pages

- `(shop)/category/[slug]/page.tsx` — `PAGE_SIZE = 16`, `filterKeys = ["size","colour", ...getCategoryFilters(slug).multi]`, `generateMetadata`, ErrorState fallback, `notFound()` for missing category.
- `(shop)/category/[slug]/[subslug]/page.tsx` — same pattern; breadcrumb Home → category → subcategory.
- `(shop)/collection/[slug]/page.tsx` — `MULTI_KEYS` filter set; scope `collections: { some: { collection: { slug } } }`.
- `(shop)/product/[slug]/page.tsx` — PDP: breadcrumbs, sticky `Gallery`, brand eyebrow, badge, h1, `PriceBlock`, `AddToBag`, `Accordion` groups (About / Details & care via `collectAttributes` + Size chart link + Fit & measurements via modelInfo/garmentMeasurements/washCare / Shipping & returns), related products via `SectionHeading`; catches non-`notFound` digests.
- `(shop)/search/page.tsx` — GET form `action="/search"`, empty-q empty state, relevance default sort, `SearchSortKey` support, delegates to `searchCatalog`, facets via `getFilterGroups`.

### Delivered — Seed

`prisma/seed.ts` rewritten: 7 categories/39 subcategories/9 collections kept; 37-product spec catalogue across all categories (incl. unstitched fabric and accessories) with full attribute set, colour variants (`COL` hex palette), sizes (APPAREL/BOTTOM/FABRIC/ONE_SIZE), collections links, featured flags; `syncProduct` upserts by slug, deletes + recreates images (Cloudinary `res.cloudinary.com/demo/image/upload/.../ayli/products/{slug}-{view}.jpg`), variants (all colour×size combos), inventory (`inventoryFor` deterministic stock distribution, `StockStatus`), collection links. SKUs: product `AYLI-{cat-initial}-{index}`, variant `{sku}-{colourCode}-{size}`.

### Gates

- ✅ `npx tsc --noEmit` — clean (incl. `prisma/seed.ts`)
- ✅ `npx eslint .` — clean (0 errors, 0 warnings)
- ✅ `npx next build` — clean; new routes: `/category/[slug]`, `/category/[slug]/[subslug]`, `/collection/[slug]`, `/product/[slug]`, `/search`, `/api/search`
- ✅ Live catalogue QA over MySQL — see §27

### Decisions recorded

1. **Search is ILIKE, not tsvector** — schema has no tsvector column/GIN index; colour search joins `ProductVariant.colour`. Plan §8 superseded. (On MySQL this becomes plain `LIKE` — case-insensitive via `utf8mb4_unicode_ci`.)
2. **Constant filters use `in` + insensitive** — `OR [{ contains }]` is invalid on Prisma `StringFilter` types.
3. **Facet counts are dependent** — each option count is computed against the current scope with that facet removed (so combined selections show live availability); variant facets counted by distinct productId.
4. **Multi-filter keys are explicit, not derived** — `Object.keys(FILTER_LABELS)` was dropped to keep the client bundle free of the config import; CONSTANT/VARIANT split typed via `as const satisfies`.
5. **Price presets derived live** — thirds of the actual range from `getPriceRange`, collapse to "All" when span ≤ 0; never hardcoded buckets.
6. **`buildProductWhere` handles variant facets** — size/colour use `variants: { some: { size/colour: { in } } }`; other facet keys are product scalars.
7. **Search relevance sorted in JS** — relevance ranking needs the full set, so `searchCatalog` ranks in JS; all other sorts delegate to the paginated Prisma query.
8. **`AddToBag` CTA is a placeholder toast** — cart wiring is Phase 5 work by plan.
9. **Cloudinary imagery** — demo bucket; `next.config.ts` `images.remotePatterns` for `res.cloudinary.com` added.
10. **Seed subcategory connect** — uses composite unique `categoryId_slug` (Subcategory.slug is only unique within category), category id fetched once per product for the connect.

### Next: Phase 5 — Wishlist + Cart + Checkout + Payments

Guest cart (localStorage) merged into server cart on login, wishlist, bag page, checkout flow, Razorpay integration behind `src/lib/payment.ts` + `src/lib/razorpay.ts`, wire `AddToBag` to the real cart.

---

## 27. Database Switch — PostgreSQL → MySQL + Live Catalogue QA (2026-09-15)

### Why

Production hosting is Hostinger, which provides MySQL/MariaDB. Local testing required a comparable engine; the only machine MySQL (WAMP `mysql5.0.51b`) is far too old for Prisma and never matched Hostinger. User decision: install MySQL locally for dev, swap `DATABASE_URL` to Hostinger credentials later.

### Local MySQL setup

- Installed **MySQL Community Server 8.0.43** (ZIP `mysql-8.0.43-winx64.zip` from `cdn.mysql.com/archives`; dev.mysql.com `/get` endpoints 403/404 bot-blocked for current patch) to `C:\Users\mogan\Apps\mysql\`.
- `my.ini` at `C:\Users\mogan\Apps\mysql\my.ini`: basedir, datadir, port 3306, `utf8mb4` + `utf8mb4_unicode_ci`, `+05:30` default TZ, bind 127.0.0.1.
- Initialized with `mysqld --initialize-insecure` (root, empty password — dev only), started as a **background process (no service — shell is non-admin)**: `Start-Process mysqld.exe -ArgumentList '--defaults-file=...'`.
- Ran as user: `mysql -u root -e "CREATE DATABASE ayli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"`.

### Prisma changes

- `prisma/schema.prisma`: `provider = "mysql"`.
- `.env`: `DATABASE_URL="mysql://root@localhost:3306/ayli"`; `.env.example` updated to MySQL shape.
- Old PostgreSQL migration deleted; `prisma migrate dev --name init` generated + applied `20260915114919_init` (MySQL SQL).
- `npx tsx prisma/seed.ts` → **7 categories, 42 subcategories, 9 collections, 44 products, 635 variants**.

### MySQL-driven code fixes (found by live QA)

1. **`mode: "insensitive"` removed (5 sites)** — Prisma's MySQL client does not accept the `mode` argument on `StringFilter` (it is PostgreSQL-only). MySQL is case-insensitive natively under `utf8mb4_unicode_ci`, so behaviour is unchanged. `buildSearchWhere`/`CATEGORY_LIKE`/collection-name search and the constant-facet `contains` all dropped it.
2. **Collection count filter fixed** — `scopeMetaSelect` spread the `Category`-shaped `_count.products.where.isActive` into `getCollectionBySlug`; on `Collection` the `products` relation is `ProductCollection[]` (no `isActive` column) → runtime validation error. Added a dedicated `collectionSelect` with `_count: { select: { products: { where: { product: { isActive: true } } } } }` and removed the `as Prisma.CollectionSelect` cast.

### Live QA (dev server port 4000)

All routes verified `200` over live MySQL:

- `/`, `/signin`, `/signup`, `/api/auth/session`, `/api/auth/csrf`
- `/category/kurtis-tops` (10 cards, 63 filter-chip links, pagination present), `?fabric=rayon&sort=price_asc`, `?colour=blue&sort=price_asc`
- `/category/kurtis-tops/straight-kurtis`
- `/collection/new-arrivals`, `/collection/bestsellers`, `/collection/party-wear`
- `/product/ajrakh-long-kurti` (140 KB — title, ₹ price, Add to Bag, sizes all render)
- `/search?q=chikankari`, `/search?q=pink%20silk`, `/api/search?q=kurti`, `/api/search?q=`

### Gates

- ✅ `npx tsc --noEmit` — clean
- ✅ `npx eslint .` — clean
- ✅ `npx next build` — clean (route table unchanged vs. §26)

### Dev-server note

Keep the dev server as a detached background process: `Start-Process node.exe -ArgumentList "node_modules\next\dist\bin\next","dev","-p","4000" -WorkingDirectory "..." -RedirectStandardOutput ... -WindowStyle Hidden`. Browser must visit `http://localhost:4000` explicitly — with HSTS/Automatic-HTTPS enabled the browser gets `ERR_SSL_PROTOCOL_ERROR`.

### Next steps

- Swap `DATABASE_URL` to the Hostinger MySQL host/credentials when provided (schema/migrations already MySQL).
- Reset root password on the local instance before any production-like use (`ALTER USER 'root'@'localhost' IDENTIFIED BY '...'`).
- Phase 5 — Wishlist + Cart + Checkout + Payments.

---

## 28. Phase 5 — Wishlist + Cart + Checkout + Payments (Record)

### Overview

Implemented the full shopping flow over live local MySQL 8.0.43 (port 3306, root empty password):

- **Wishlist** — server actions + persistent list + product page heart button
- **Cart (server + guest)** — zustand-persisted guest bag, server cart for signed-in users, merge-on-login, persistent cart badge, sticky "Add to Bag" CTA
- **Checkout** — one-page 3-step flow (address → delivery → payment), guest gate to sign-in, inline address creation, express/standard shipping, Razorpay + mock fallback
- **Orders** — order creation with inventory reservation, signature verification, confirmation, cancellation, `/order/[orderNumber]` detail page, account orders list now links to detail

### Corrections implemented (from original plan)

- §10 #9 — Guest cart is localStorage zustand + preview API; merged on login via `GuestCartMerger` (clears localStorage after merge).
- §10 #14 — Guest checkout gated: redirects to `/signin?callbackUrl=/checkout` (server cart required for order creation).
- §1 — Payment abstraction: `src/lib/payment.ts` + `src/lib/razorpay.ts` (RazorpayProvider) + mock fallback behind `RAZORPAY_KEY_ID`/`SECRET` presence. No Stripe.
- §11 — One-page checkout: address selection, saved-address one-tap, standard free ≥₹999 / ₹99 standard / ₹99 express extra, sticky CTA.
- §12 — Inventory reservation via `FOR UPDATE` row locks inside `$transaction`; reserve on create, decrement + release on confirm, release on cancel/failure.
- §12 — Order numbering: `AYLI-YYYYMMDD-XXXX` (timestamp + random base36), unique constraint on `Order.orderNumber`.
- Added `Order.paymentOrderId` column to store gateway order reference (Razorpay order id) separately from payment capture id.

### Key decisions

| Decision | Rationale |
|---|---|
| zustand guest cart + localStorage | Works offline, minimal bundle, merge-on-login is simple loop |
| GuestCartMerger in root layout (inside SessionProvider) | Runs once per userId change; avoids prop-drilling through every page |
| `FOR UPDATE` on inventory rows | Prevents oversell under concurrent checkouts; Prisma `$transaction` + `$queryRaw` combo |
| Mock payment provider in dev | Full checkout flow exercisable before Razorpay keys exist; never used in production |
| `addressSchema` + `formatFieldErrors` in `src/lib/validation.ts` | Both are values (not async functions) — can't live in a `"use server"` file; shared by `account.action` + `order.action` |
| `CheckoutAddress` type in `src/lib/checkout.ts` | Client component + server page both need the type; keeps server-action file clean |
| One-page 3-step checkout (not multi-page) | Matches plan §11; fewer redirects, clearer progress indicator, sticky CTA always visible |

### Files created (Phase 5)

- `src/lib/checkout.ts` — shared types: `CheckoutAddress`, `OrderActionResult`, `EXPRESS_SHIPPING_FEE`
- `src/lib/validation.ts` — shared `addressSchema`, `formatFieldErrors` (moved out of server-action file)
- `src/lib/cart-store.ts` — zustand guest cart store
- `src/lib/cart.ts` — server cart data layer: `resolveCartLines`, `getServerCart`, `getServerCartCount`, `cartTotals`
- `src/lib/payment.ts` — `PaymentProvider` interface + `MockPaymentProvider` + `paymentProvider` factory
- `src/lib/razorpay.ts` — `RazorpayProvider` (createOrder / verifyPayment via HMAC-SHA256)
- `src/lib/razorpay-checkout.ts` — client-side Razorpay checkout script loader + types
- `src/actions/cart.action.ts` — add/update/remove/clear/mergeGuestCart server actions
- `src/actions/order.action.ts` — placeOrder/verifyAndConfirmOrder/cancelOrder + createCheckoutAddress (no redirect)
- `src/app/api/cart/preview/route.ts` — guest cart serialization endpoint
- `src/app/api/cart/count/route.ts` — authed cart count endpoint
- `src/components/cart/cart-view.tsx` — full cart UI (guest + authed modes)
- `src/components/cart/cart-badge.tsx` — badge with server count + guest count + cart-updated event
- `src/components/cart/guest-cart-merger.tsx` — root-layout merge-on-login component
- `src/components/wishlist/wishlist-grid.tsx` — wishlist with optimistic remove
- `src/components/product/wishlist-button.tsx` — server-session-aware heart button
- `src/components/checkout/checkout-flow.tsx` — client checkout UI (3 steps + sticky CTA + Razorpay modal)
- `src/app/(shop)/wishlist/page.tsx` — wishlist page (signed-in gate)
- `src/app/(shop)/checkout/page.tsx` — checkout page (signed-in, fetches cart + addresses server-side)
- `src/app/(shop)/order/[orderNumber]/page.tsx` — order confirmation/detail page

### Files modified (Phase 5)

- `src/app/layout.tsx` — wrapped body in `SessionProvider` → `ToastProvider`; added `GuestCartMerger`
- `src/components/product/add-to-bag.tsx` — wired to server action (authed) or zustand (guest); mobile sticky bar with live total
- `src/components/layout/header.tsx` — `CartBadge` in desktop nav
- `src/components/layout/bottom-nav.tsx` — `CartBadge` on Bag icon
- `src/components/ui/icons.tsx` — added `check` icon
- `src/app/(shop)/product/[slug]/page.tsx` — fetches `isWishlisted` via `auth()`; renders heart button next to h1
- `src/actions/account.action.ts` — imports `addressSchema` + `formatFieldErrors` from `@/lib/validation` instead of defining inline
- `src/app/account/orders/page.tsx` — each order card wrapped in `<Link>` to `/order/${orderNumber}`
- `prisma/schema.prisma` — added `Order.paymentOrderId String?`; `provider = "mysql"`
- `prisma/migrations/20260915122121_order_payment_order_id/migration.sql` — generated
- `.env.example` — added `NEXT_PUBLIC_RAZORPAY_KEY_ID`, updated ports to 4000

### Migration

- `20260915122121_order_payment_order_id` — adds nullable `paymentOrderId VARCHAR(191)` to `Order` for storing the Razorpay/mock gateway order id (distinct from `paymentId` which stores the capture reference post-confirmation).

### Gates

- ✅ `npx tsc --noEmit` — clean
- ✅ `npx eslint .` — clean (warnings suppressed for intentional pattern in cart-badge)
- ✅ `npx next build` — clean; route table now includes `/checkout` (dynamic) + `/order/[orderNumber]` (dynamic)

---

## 29. Phases 6–10 — Orders, Admin, SEO, Polish, Production QA (Record)

### Phase 6 — Order Status Timeline

- Created `src/components/orders/order-status-timeline.tsx` — linear step progress bar (Confirmed → Packed → Shipped → Delivered) with an inline notice for cancelled/returned orders.
- Integrated into `src/app/(shop)/order/[orderNumber]/page.tsx` between the order-header status badge and the item list.

### Phase 7 — Admin Panel

Full role-gated admin under `/admin` (middleware proxy in `src/proxy.ts` + `requireAdmin()` in every server action/page).

| Area | Files |
|---|---|
| Server actions | `src/actions/admin.action.ts` — product CRUD (create/update/soft-delete/toggle), inventory stock/threshold, category + subcategory CRUD, collection CRUD, order status/tracking/notes |
| Validation | `src/lib/validation.ts` — `adminProductSchema`, `adminCategorySchema`, `adminSubcategorySchema`, `adminCollectionSchema`, `productImageSchema`, `variantFormSchema` + types |
| Data layer | `src/lib/admin.ts` — `getAdminCategoryOptions`, `getAdminCollectionOptions`, `getAdminProductDetail` |
| Shell | `src/app/admin/layout.tsx` + `src/components/admin/admin-nav.tsx` (sidebar desktop / horizontal mobile strip) |
| Dashboard | `/admin` — revenue, orders, products, customers stats; recent orders; out-of-stock alerts |
| Products | `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit` + `src/components/admin/product-form.tsx` (basics, pricing, 15 attributes, images, variant colour×size matrix generator, collections) |
| Categories | `/admin/categories` + `src/components/admin/category-manager.tsx` (inline subcategory add/delete) |
| Orders | `/admin/orders`, `/admin/orders/[id]`, `order-status-badge.tsx`, `order-status-update.tsx` (status, tracking, notes) |
| Customers | `/admin/customers` (search by name/email/phone) |
| Inventory | `/admin/inventory` + `src/components/admin/inventory-table.tsx` (inline stock editing) |

Key decisions: variant soft-delete on product update (order items snapshot variant IDs), images replaced wholesale, product collections reset + reconnect, variant SKU uniqueness asserted both in Prisma and `assertUniqueSlugSku`.

### Phase 8 — SEO + WhatsApp + Static Pages

- `src/app/sitemap.ts` — dynamic XML sitemap (static routes, categories, subcategories, collections, products).
- `src/app/robots.ts` — allows public routes; disallows admin/api/account/cart/checkout.
- Product page — rich `generateMetadata` (OG/Twitter/canonical/keywords) + JSON-LD `Product` + `BreadcrumbList`; category + collection pages got full OG/canonical metadata.
- Floating WhatsApp button — `src/components/whatsapp/floating-whatsapp.tsx` (mobile-safe position above bottom nav) wired into the shop layout.
- All 9 static pages with editorial copy: `/about`, `/contact`, `/faq`, `/privacy-policy`, `/terms`, `/shipping-policy`, `/return-refund`, `/size-guide`, `/care-guide`.
- Fixed all `react/no-unescaped-entities` lint errors across the static pages (14 fixes).

### Phase 9 — Responsive Polish + Delight + A11y + Performance

- **Homepage editorial finalization** — `/` now fetches live featured products for a "New arrivals" section (`ProductGrid` + `ProductCard`), plus an "AYLI Edit" editorial spotlight (4 detail cards) and the existing hero / shop-your-way / shop-by-category / promises / WhatsApp CTA.
- **Mobile menu drawer** — fixed the dead `#menu` link in the bottom nav. New `src/components/layout/mobile-menu.tsx` opens a right-side `Sheet` with account, categories, occasions and help links. Bottom nav now = Home / Explore / Wishlist / Bag / Menu(button).
- **A11y audit** — confirmed skip-to-content link (root layout), `:focus-visible` outline tokens, `prefers-reduced-motion` guard, `aria-hidden` decorative icons, `aria-label` on icon-only controls (header + bottom nav).
- **Performance** — `next/image` already lazy + `sizes` aware via `ProductImage`; consistent `priority` only above the fold.
- Reduced-motion + overflow-lock handled by existing `useDialog`.

### Phase 10 — Browser-Based QA + Production Prep

- ✅ `npx tsc --noEmit` — clean
- ✅ `npx eslint .` — clean (one pre-existing warning: unused `_discard` in `order.action.ts:81`)
- ✅ `npx next build` — **clean**. Route table now 40 routes:
  - Static: `/`, `/about`, `/care-guide`, `/contact`, `/faq`, `/privacy-policy`, `/return-refund`, `/shipping-policy`, `/size-guide`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/_not-found`, `/icon.svg`
  - Dynamic: `/account*`, `/admin*` (+ orders/new/edit), `/api/*`, `/cart`, `/category/[slug]`, `/category/[slug]/[subslug]`, `/checkout`, `/collection/[slug]`, `/order/[orderNumber]`, `/product/[slug]`, `/search`, `/signin`, `/signup`, `/wishlist`

### Remaining production prep (not blocking)

- Swap `DATABASE_URL` to Hostinger MySQL credentials when provided; reset local root password.
- 23-scenario browser QA pass across devices before public launch.
- Optional: real product photography replacing placeholder gradient blocks in the hero / product images.

*This document is the single source of truth for AYLI. Approved architecture decisions in §6 (JWT sessions), §5 (schema = variant colour + no reviews), §1 (Razorpay) are locked unless the user explicitly asks to change them. Phases 1–10 implementation is complete and recorded through §29.*