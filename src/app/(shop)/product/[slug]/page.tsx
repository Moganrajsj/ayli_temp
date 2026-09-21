import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { auth } from "@/lib/auth";
import { isWishlisted } from "@/lib/wishlist";
import { SITE_URL } from "@/config/constants";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ErrorState } from "@/components/ui/error-state";
import { Gallery } from "@/components/product/gallery";
import { AddToBag } from "@/components/product/add-to-bag";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Accordion } from "@/components/product/accordion";
import { PriceBlock } from "@/components/product/price-block";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid } from "@/components/product/product-grid";
import {
  getProductBySlug,
  getRelatedProducts,
  serializeProductCard,
} from "@/lib/catalog";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product not found" };

  const { product } = data;
  const image = product.images.find((img) => img.isMain)?.url ?? product.images[0]?.url;
  const url = `${SITE_URL}/product/${product.slug}`;

  return {
    title: product.name,
    description:
      product.shortDescription ??
      product.description ??
      `Shop the ${product.name} at AYLI — crafted in ${product.fabric ?? "beautiful"} fabrics.`,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description:
        product.shortDescription ??
        `Shop the ${product.name} at AYLI.`,
      url,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      images: image ? [image] : undefined,
    },
    keywords: [product.productType, product.fabric, product.pattern, product.occasion, "women's fashion"].filter(
      Boolean,
    ) as string[],
  };
}

interface Attribute {
  label: string;
  value: string;
}

function collectAttributes(product: {
  brand: string | null;
  productType: string | null;
  fabric: string | null;
  pattern: string | null;
  printType: string | null;
  sleeveType: string | null;
  neckType: string | null;
  length: string | null;
  fit: string | null;
  waist: string | null;
  rise: string | null;
  occasion: string | null;
  material: string | null;
  countryOfOrigin: string | null;
}): Attribute[] {
  const entries: Array<[string, string | null]> = [
    ["Product type", product.productType],
    ["Fabric", product.fabric],
    ["Pattern", product.pattern],
    ["Print type", product.printType],
    ["Sleeve", product.sleeveType],
    ["Neck", product.neckType],
    ["Length", product.length],
    ["Fit", product.fit],
    ["Waist", product.waist],
    ["Rise", product.rise],
    ["Material", product.material],
    ["Occasion", product.occasion],
    ["Brand", product.brand],
    ["Made in", product.countryOfOrigin],
  ];
  return entries
    .filter((pair): pair is [string, string] => Boolean(pair[1] && pair[1].trim()))
    .map(([label, value]) => ({ label, value }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let data;
  let related;
  let wishlisted = false;
  try {
    data = await getProductBySlug(slug);
    if (!data) notFound();
    related = await getRelatedProducts(data.product.id, data.product.category.id, 8);
    const session = await auth();
    if (session?.user?.id) {
      wishlisted = await isWishlisted(session.user.id, data.product.id);
    }
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return (
      <PageContainer className="py-16">
        <ErrorState title="Could not load this product" />
      </PageContainer>
    );
  }

  const { product, variants, discountPercent } = data;
  const sellingPrice = product.sellingPrice.toNumber();

  const attributes = collectAttributes(product);
  const imageSlides = product.images.map((image) => ({
    url: image.url,
    alt: image.alt ?? product.name,
  }));

  const crumbs = [
    { label: "Home", href: "/" },
    {
      label: product.category.name,
      href: `/category/${product.category.slug}`,
    },
    ...(product.subcategory
      ? [
          {
            label: product.subcategory.name,
            href: `/category/${product.category.slug}/${product.subcategory.slug}`,
          },
        ]
      : []),
    { label: product.name },
  ];

  const productPageUrl = `${SITE_URL}/product/${slug}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.images.map((img) => img.url),
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: [product.category.name, product.subcategory?.name].filter(Boolean).join(" > "),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: sellingPrice,
      highPrice: variants.length > 0 ? Math.max(...variants.map((v) => v.price ?? sellingPrice)) : sellingPrice,
      availability: sellingPrice > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: productPageUrl,
    },
    aggregateRating: undefined,
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: crumb.href ? `${SITE_URL}${crumb.href}` : undefined,
    })),
  };

  return (
    <div className="pb-24 pt-5 lg:pb-16">
      <PageContainer>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
        />
        <Breadcrumbs items={crumbs} className="mb-6" />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ViewTransition name={`product-${product.slug}`} share="morph" default="none">
            <Gallery images={imageSlides} className="lg:sticky lg:top-24" />
          </ViewTransition>

          <div className="min-w-0">
            <div className="space-y-3">
              {discountPercent > 0 ? (
                <Badge variant="discount">{discountPercent}% off</Badge>
              ) : null}
              {product.brand ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ayli-blue">
                  {product.brand}
                </p>
              ) : null}
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {product.name}
                </h1>
                <WishlistButton
                  productId={product.id}
                  initiallyWishlisted={wishlisted}
                  className="mt-1 shrink-0"
                />
              </div>
              <PriceBlock mrp={product.mrp.toNumber()} sellingPrice={sellingPrice} />
              <p className="text-xs text-muted">Inclusive of all taxes</p>
            </div>

            <AddToBag
              productName={product.name}
              variants={variants}
              basePrice={sellingPrice}
              className="mt-8"
            />

            <div className="mt-10">
              <Accordion
                items={[
                  {
                    title: "About this style",
                    content: product.shortDescription ||
                      product.description ||
                      "Details coming soon.",
                  },
                  {
                    title: "Details & care",
                    content: attributes.length ? (
                      <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {attributes.map((attribute) => (
                          <li key={attribute.label} className="flex flex-col gap-0.5">
                            <span className="text-xs uppercase tracking-wide text-muted/70">
                              {attribute.label}
                            </span>
                            <span className="text-ink">{attribute.value}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Fabric and care instructions are being finalised."
                    ),
                  },
                  {
                    title: "Fit & measurements",
                    content: (
                      <div className="space-y-3">
                        {product.fit ? (
                          <p>Fit: {product.fit}</p>
                        ) : null}
                        {product.modelInfo ? (
                          <p>{product.modelInfo}</p>
                        ) : null}
                        {product.garmentMeasurements ? (
                          <p>{product.garmentMeasurements}</p>
                        ) : null}
                        {product.washCare ? (
                          <p>Care: {product.washCare}</p>
                        ) : null}
                        {product.sizeChartUrl ? (
                          <a
                            href={product.sizeChartUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-ayli-blue hover:text-[#1496a8]"
                          >
                            View size chart
                          </a>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    title: "Shipping & returns",
                    content:
                      "Free shipping on orders above ₹999. Dispatch within 24 hours. 15-day hassle-free returns and exchanges.",
                  },
                ]}
              />
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-16 lg:mt-24">
            <SectionHeading
              eyebrow="Complete the look"
              title="You may also like"
              href={`/category/${product.category.slug}`}
              hrefLabel="View all"
            />
            <ProductGrid className="mt-6">
              {related.map((item) => (
                <ProductCard
                  key={item.slug}
                  product={serializeProductCard(item)}
                />
              ))}
            </ProductGrid>
          </section>
        ) : null}
      </PageContainer>
    </div>
  );
}