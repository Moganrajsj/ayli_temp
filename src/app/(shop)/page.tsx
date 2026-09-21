import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button";
import { getCatalogListing, serializeProductCard } from "@/lib/catalog";
import { HeroSlider } from "@/components/layout/hero-slider";
import { VideoText } from "@/components/ui/video-text";
import { NewArrivalsSection } from "@/components/product/new-arrivals-section";
import { getHomepageCategorySections } from "@/lib/homepage-config";
import { CategoryProductSection } from "@/components/product/category-product-section";
import { TestimonialsMarquee } from "@/components/home/testimonials-marquee";
import { AnimateOnMount } from "@/components/ui/motion";

const STORY_CATEGORIES = [
  {
    name: "Under ₹999",
    href: "/collection/sale",
    badgeText: "₹999",
    isPriceBadge: true,
  },
  {
    name: "Kurta Sets",
    href: "/category/kurta-sets",
    image: "/images/cat-kurtas.jpg",
    tag: "Trending",
  },
  {
    name: "Co-ord Sets",
    href: "/category/co-ord-sets",
    image: "/images/hero-coord.jpg",
    tag: "New",
  },
  {
    name: "Dresses",
    href: "/category/dresses",
    image: "/images/cat-dresses.jpg",
  },
  {
    name: "Festive Edit",
    href: "/collection/festive-collection",
    image: "/images/hero-banner.jpg",
    tag: "Special",
  },
  {
    name: "Under ₹599",
    href: "/collection/sale",
    badgeText: "₹599",
    isPriceBadge: true,
  },
  {
    name: "New In",
    href: "/collection/new-arrivals",
    tag: "Fresh",
    image: "/images/cat-kurtas.jpg",
  },
];

const PROMISES = [
  { icon: "truck" as const, title: "Free shipping", text: "On orders above ₹999", color: "text-ayli-peach" },
  { icon: "shield" as const, title: "Easy returns", text: "15-day hassle-free", color: "text-ayli-blue" },
  { icon: "box" as const, title: "Fast dispatch", text: "Ships within 24 hours", color: "text-ayli-peach" },
  { icon: "sparkles" as const, title: "Loved styles", text: "Curated for Indian women", color: "text-ayli-blue" },
];

export default async function HomePage() {
  let featured = [] as ReturnType<typeof serializeProductCard>[];
  let categorySections: Awaited<ReturnType<typeof getHomepageCategorySections>> = [];
  try {
    const [listing, sections] = await Promise.all([
      getCatalogListing(
        { isActive: true, isFeatured: true },
        { sort: "newest", page: 1, facets: {} },
        12
      ),
      getHomepageCategorySections(),
    ]);
    featured = listing.products.map(serializeProductCard);
    categorySections = sections;
  } catch {
    // Homepage renders gracefully without catalogue data (e.g. DB briefly down).
  }

  return (
    <>
      {/* ── Social Proof Header Strip (Aramya inspired) ── */}
      <div className="border-b border-hairline/70 bg-blush/60 py-2 text-center">
        <p className="text-xs font-medium tracking-wide text-plum flex items-center justify-center gap-2">
          <span className="text-gold">🌾</span>
          <span>Over <strong className="font-semibold text-ink">50,000+</strong> Modern Indian Women Love AYLI</span>
          <span className="text-gold">🌾</span>
        </p>
      </div>

{/* ── Story Category Circles Navigation (Aramya inspired) ── */}
      <section className="border-b border-hairline/60 bg-warm-white py-4 shadow-2xs">
        <PageContainer>
          <div className="no-scrollbar flex items-center justify-start sm:justify-center gap-4 sm:gap-7 overflow-x-auto px-1 py-1">
            {STORY_CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                href={cat.href}
                className="group flex shrink-0 flex-col items-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 active:scale-90 animate-fade-up"
                style={{ animationDelay: `${100 + i * 55}ms` }}
              >
                <div className="relative">
                  <div className="relative grid h-[68px] w-[68px] sm:h-[76px] sm:w-[76px] place-items-center overflow-hidden rounded-full p-[2px] transition-all duration-300 ring-2 ring-ayli-peach/30 group-hover:ring-4 group-hover:ring-ayli-peach shadow-xs">
                    {cat.isPriceBadge ? (
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#FFE4ED] via-[#FFF0F4] to-[#F2E8FF] text-center">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Under</span>
                        <span className="font-display text-base font-bold text-plum leading-none">{cat.badgeText}</span>
                      </div>
                    ) : (
                      <div className="relative h-full w-full overflow-hidden rounded-full">
                        <Image
                          src={cat.image!}
                          alt={cat.name}
                          fill
                          sizes="80px"
                          className="object-cover object-top animate-fade-in transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    )}
                  </div>
                  {cat.tag && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-pill bg-plum px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                      {cat.tag}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-ink transition-colors group-hover:text-ayli-peach">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ── Hero Slider ── */}
      <HeroSlider />

      {/* ── What's today's mood? ── */}
      <section className="py-14 sm:py-20 overflow-hidden">
{/* Section header */}
        <PageContainer>
          <AnimateOnMount animation="animate-fade-up" className="mb-8 sm:mb-12 flex flex-col items-center text-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.35em] uppercase text-ayli-peach">
              Shop your way
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light italic text-ink leading-tight">
              What&apos;s today&apos;s mood?
            </h2>
            <p className="text-sm text-muted max-w-xs sm:max-w-sm leading-relaxed">
              Effortless edits for the way you actually live.
            </p>
          </AnimateOnMount>
        </PageContainer>

        {/* Mood cards — horizontal scroll on mobile, 4-col on desktop */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
          <div className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {[
              {
                slug: "casual-wear",
                label: "Everyday",
                tagline: "Effortless all day",
                image: "/images/cat-kurtas.jpg",
                accent: "from-rose-900/70",
                num: "01",
              },
              {
                slug: "office-wear",
                label: "Office",
                tagline: "Polished & poised",
                image: "/images/hero-coord.jpg",
                accent: "from-indigo-900/70",
                num: "02",
              },
              {
                slug: "festive-collection",
                label: "Festive",
                tagline: "Celebration-ready",
                image: "/images/hero-banner.jpg",
                accent: "from-amber-900/70",
                num: "03",
              },
              {
                slug: "party-wear",
                label: "Party",
                tagline: "Made to be noticed",
                image: "/images/cat-dresses.jpg",
                accent: "from-purple-900/70",
                num: "04",
              },
            ].map((mood) => (
              <Link
                key={mood.slug}
                href={`/collection/${mood.slug}`}
                className="group relative flex-shrink-0 w-[62vw] sm:w-auto overflow-hidden rounded-2xl sm:rounded-3xl bg-ink aspect-[3/4] sm:aspect-[3/4] transition-transform duration-300 ease-out active:scale-[0.985]"
              >
                {/* Background image */}
                <Image
                  src={mood.image}
                  alt={mood.label}
                  fill
                  sizes="(max-width: 640px) 62vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-top animate-fade-in transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Always-on gradient for text legibility */}
                <div className={`absolute inset-0 bg-gradient-to-t ${mood.accent} via-transparent to-transparent opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Editorial number — top left */}
                <span className="absolute top-4 left-4 font-serif text-[11px] tracking-[0.25em] text-white/50 select-none">
                  {mood.num}
                </span>

                {/* Content — bottom */}
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <p className="font-serif text-xl sm:text-2xl font-light italic text-white leading-tight mb-0.5">
                    {mood.label}
                  </p>
                  <p className="text-[11px] font-light tracking-wide text-white/65 mb-3">
                    {mood.tagline}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-light tracking-[0.18em] uppercase text-white/80 transition-all duration-300 group-hover:text-white group-hover:gap-2.5">
                    Explore
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </div>

                {/* Hover shimmer line at top */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── New arrivals ── */}
      <NewArrivalsSection products={featured} />

      {/* ── Shop by category ── */}
      <section id="shop-by-category" className="py-12 sm:py-20 bg-blush/30">
        <div className="px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
{/* Header */}
          <AnimateOnMount animation="animate-fade-up" className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.35em] uppercase text-ayli-peach block mb-1">
                The collection
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light italic text-ink leading-tight">
                Shop by category
              </h2>
            </div>
            <p className="text-sm text-muted max-w-xs leading-relaxed sm:text-right">
              Seven considered categories —<br className="hidden sm:block" /> everything you need.
            </p>
          </AnimateOnMount>

          {/* Bento grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2 auto-rows-[220px] lg:auto-rows-[260px]">

{/* 01 — Kurtis & Tops · HERO TILE: 2 cols × 2 rows */}
            <Link
              href="/category/kurtis-tops"
              className="group relative col-span-2 row-span-2 overflow-hidden rounded-2xl sm:rounded-3xl bg-ink transition-transform duration-300 ease-out active:scale-[0.985]"
            >
              <Image src="/images/cat-kurtas.jpg" alt="Kurtis & Tops" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover object-top animate-fade-in transition-transform duration-700 group-hover:scale-105" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              {/* Corner number */}
              <span className="absolute top-5 left-5 font-serif text-[11px] tracking-[0.3em] text-white/40 select-none">01</span>
              {/* Content */}
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                <span className="mb-2 inline-block rounded-full border border-white/30 px-3 py-0.5 text-[10px] font-medium tracking-widest uppercase text-white/80">
                  Most loved
                </span>
                <p className="font-serif text-3xl sm:text-4xl font-light italic text-white leading-tight">
                  Kurtis &amp; Tops
                </p>
                <p className="mt-1.5 text-sm text-white/60 max-w-[28ch]">Straight, A-line &amp; everyday tops</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-light tracking-[0.2em] uppercase text-white/75 transition-all duration-300 group-hover:text-white group-hover:gap-3">
                  Explore <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </div>
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-ayli-peach/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Link>

{/* 02 — Co-ord Sets · 1 col × 1 row */}
            <Link href="/category/co-ord-sets" className="group relative overflow-hidden rounded-2xl bg-ink transition-transform duration-300 ease-out active:scale-[0.985]">
              <Image src="/images/hero-coord.jpg" alt="Co-ord Sets" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover object-top animate-fade-in transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <span className="absolute top-3 left-3 font-serif text-[10px] tracking-[0.3em] text-white/35 select-none">02</span>
              <div className="absolute bottom-0 inset-x-0 p-4">
                <p className="font-serif text-lg font-light italic text-white leading-tight">Co-ord Sets</p>
                <p className="text-[11px] text-white/55 mt-0.5">Top &amp; pant pairings</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/65 group-hover:text-white group-hover:gap-2.5 transition-all duration-300">
                  Shop <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                </span>
              </div>
            </Link>

{/* 03 — Dresses · 1 col × 1 row */}
            <Link href="/category/dresses" className="group relative overflow-hidden rounded-2xl bg-ink transition-transform duration-300 ease-out active:scale-[0.985]">
              <Image src="/images/cat-dresses.jpg" alt="Dresses" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover object-top animate-fade-in transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <span className="absolute top-3 left-3 font-serif text-[10px] tracking-[0.3em] text-white/35 select-none">03</span>
              <div className="absolute bottom-0 inset-x-0 p-4">
                <p className="font-serif text-lg font-light italic text-white leading-tight">Dresses</p>
                <p className="text-[11px] text-white/55 mt-0.5">Short, midi &amp; maxi</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/65 group-hover:text-white group-hover:gap-2.5 transition-all duration-300">
                  Shop <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                </span>
              </div>
            </Link>

{/* 04 — Kurta Sets · 1 col × 1 row */}
            <Link href="/category/kurta-sets" className="group relative overflow-hidden rounded-2xl bg-ink transition-transform duration-300 ease-out active:scale-[0.985]">
              <Image src="/images/hero-banner.jpg" alt="Kurta Sets" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover object-top animate-fade-in transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <span className="absolute top-3 left-3 font-serif text-[10px] tracking-[0.3em] text-white/35 select-none">04</span>
              <div className="absolute bottom-0 inset-x-0 p-4">
                <p className="font-serif text-lg font-light italic text-white leading-tight">Kurta Sets</p>
                <p className="text-[11px] text-white/55 mt-0.5">With pant &amp; dupatta</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/65 group-hover:text-white group-hover:gap-2.5 transition-all duration-300">
                  Shop <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                </span>
              </div>
            </Link>

            {/* 05 — Bottoms · accent card with gradient bg (no separate image) */}
            <Link
              href="/category/bottoms"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2A1820] to-[#4A2038] flex flex-col justify-between p-4 transition-all duration-300 hover:shadow-float"
            >
              <span className="font-serif text-[10px] tracking-[0.3em] text-white/30 select-none">05</span>
              <div>
                <p className="font-serif text-lg font-light italic text-white leading-tight">Bottoms</p>
                <p className="text-[11px] text-white/50 mt-0.5">Palazzos, pants &amp; skirts</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ayli-peach/80 group-hover:text-ayli-peach group-hover:gap-2.5 transition-all duration-300">
                  Shop <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                </span>
              </div>
              {/* Decorative orb */}
              <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-ayli-peach/20 blur-2xl pointer-events-none group-hover:bg-ayli-peach/35 transition-colors duration-500" />
            </Link>

            {/* 06 — Fabrics · accent card */}
            <Link
              href="/category/fabrics"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E2A3A] to-[#2D3F58] flex flex-col justify-between p-4 transition-all duration-300 hover:shadow-float"
            >
              <span className="font-serif text-[10px] tracking-[0.3em] text-white/30 select-none">06</span>
              <div>
                <p className="font-serif text-lg font-light italic text-white leading-tight">Fabrics</p>
                <p className="text-[11px] text-white/50 mt-0.5">Cotton, rayon &amp; Chanderi</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ayli-blue/90 group-hover:text-ayli-blue group-hover:gap-2.5 transition-all duration-300">
                  Shop <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                </span>
              </div>
              <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-ayli-blue/20 blur-2xl pointer-events-none group-hover:bg-ayli-blue/35 transition-colors duration-500" />
            </Link>

            {/* 07 — Accessories · spans 2 cols on desktop for balance */}
            <Link
              href="/category/accessories"
              className="group relative col-span-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1820] via-[#4A2038] to-[#2A1820] flex items-center justify-between px-6 py-5 sm:px-8 transition-all duration-300 hover:shadow-float"
            >
              <div>
                <span className="font-serif text-[10px] tracking-[0.3em] text-white/30 select-none block mb-2">07</span>
                <p className="font-serif text-xl sm:text-2xl font-light italic text-white leading-tight">Accessories</p>
                <p className="text-[11px] text-white/50 mt-0.5">Jewellery, bags &amp; finishing touches</p>
              </div>
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-ayli-peach/40 text-ayli-peach text-lg transition-all duration-300 group-hover:bg-ayli-peach group-hover:text-white group-hover:scale-110">
                →
              </span>
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            </Link>

          </div>
        </div>
      </section>

      {/* ── Category-Wise Product Showcases (Admin Customizable) ── */}
      {categorySections.map(({ section, products }, idx) => (
        <CategoryProductSection
          key={section.categoryId}
          title={section.title}
          eyebrow={section.eyebrow}
          subtitle={section.subtitle}
          categorySlug={section.categorySlug}
          products={products}
          bgVariant={idx % 2 === 0 ? "white" : "blush"}
        />
      ))}


      {/* ── AYLI Edit editorial spotlight ── */}
      <section className="pb-16 pt-4">
        <PageContainer>
          <div className="relative overflow-hidden rounded-[28px] border border-hairline/80 bg-gradient-to-br from-[#FFF8F9] via-[#FAF0F4] to-[#FBF2F6] p-7 sm:p-10 lg:p-14 shadow-[0_12px_44px_rgba(124,48,72,0.06)]">
            {/* Ambient decorative glows */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-ayli-peach/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-ayli-blue/10 blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
              {/* Left Column: Editorial Narrative & Pillars */}
              <div className="lg:col-span-7">
                <h2 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[44px]">
                  Details make the{" "}
                  <span className="font-serif italic font-normal text-plum">difference.</span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                  Cotton corkscrew piping, hand-drawn florals, considered pockets — every AYLI piece
                  carries a quiet detail you discover after the first wear.
                </p>

                {/* 4 Craft Pillars */}
                <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {[
                    {
                      num: "01",
                      icon: "sparkles" as const,
                      title: "Hand-Finished",
                      text: "Delicate piping, mother-of-pearl accents & artisanal stitch craft.",
                    },
                    {
                      num: "02",
                      icon: "shield" as const,
                      title: "Skin-Kind Fabrics",
                      text: "Pure Chanderi, breathable mulmul cotton & fluid natural rayons.",
                    },
                    {
                      num: "03",
                      icon: "briefcase" as const,
                      title: "Day to Evening",
                      text: "Thoughtful silhouettes designed to transition effortlessly.",
                    },
                    {
                      num: "04",
                      icon: "heart" as const,
                      title: "Made for Indian Wear",
                      text: "Proportioned fits that sit right, plus deep functional pockets.",
                    },
                  ].map((item) => (
                    <div
                      key={item.num}
                      className="group rounded-2xl border border-hairline/70 bg-white/85 p-4 shadow-xs backdrop-blur-sm transition-all duration-300 hover:border-ayli-peach/50 hover:bg-white hover:shadow-soft"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-mist/80 text-ayli-peach transition-transform group-hover:scale-105">
                          <Icon name={item.icon} className="h-4 w-4" />
                        </div>
                        <span className="font-mono text-[11px] font-bold tracking-wider text-ayli-peach/70">
                          {item.num}
                        </span>
                      </div>
                      <p className="mt-3 font-display text-base font-semibold text-ink">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button href="/about" variant="primary">
                    About the brand
                  </Button>
                  <Link
                    href="/collection/new-arrivals"
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-plum transition-colors hover:text-ayli-peach"
                  >
                    <span>Explore New In</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Editorial Visual Showcase */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Photo frame */}
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-hairline/80 bg-rose-mist shadow-float">
                    <Image
                      src="/images/ayli-edit-craft.jpg"
                      alt="The AYLI Edit craftsmanship detail"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover animate-fade-in transition-transform duration-700 hover:scale-105"
                      priority={false}
                    />

                  </div>

                  {/* Decorative stamp in background */}
                  <div className="pointer-events-none absolute -bottom-4 -right-4 -z-10 h-32 w-32 rounded-full border border-ayli-peach/20 bg-rose-mist/40 blur-sm" />
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ── Brand promises ── */}
      <section className="border-y border-hairline/60 bg-warm-white">
        <PageContainer className="py-12">
          <ul className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {PROMISES.map((promise) => (
              <li key={promise.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-mist">
                  <Icon name={promise.icon} className={`h-4.5 w-4.5 ${promise.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{promise.title}</p>
                  <p className="text-xs text-muted">{promise.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </PageContainer>
      </section>

      {/* ── WhatsApp CTA ── */}
      <section className="py-16">
        <PageContainer>
          <div className="relative overflow-hidden flex flex-col items-start justify-between gap-6 rounded-card bg-gradient-to-r from-ayli-peach/15 via-rose-mist to-ayli-blue/10 border border-ayli-peach/20 px-7 py-10 lg:flex-row lg:items-center lg:px-14">
            {/* Decorative orb */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ayli-peach/15 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-ayli-blue/10 blur-2xl pointer-events-none" />

            <div className="relative max-w-lg">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ayli-peach">We are here for you</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Need a little help{" "}
                <em className="not-italic text-plum">choosing?</em>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Message us on WhatsApp — our team is here for sizing, fabric and styling questions,
                usually in minutes.
              </p>
            </div>
            <WhatsAppButton
              message="Hi AYLI, I need help finding something"
              variant="peach"
              className="relative shrink-0"
            />
          </div>
        </PageContainer>
      </section>

{/* ── Video Text Banner (Above Testimonials) ── */}
      <section aria-label="AYLI in motion">
        <div className="relative h-[420px] w-full overflow-hidden bg-soft-beige sm:h-[500px]">
          <VideoText
            src="/videos/ayli-video-text.mp4"
            fontSize={26}
            fontWeight={700}
            fontFamily="Cormorant Garamond, serif"
            maskSize="100% 100%"
            className="size-full"
          >
            AYLI
          </VideoText>
        </div>
      </section>

      {/* ── Customer Testimonials Marquee (Top to the Footer) ── */}
      <TestimonialsMarquee />
    </>
  );
}
