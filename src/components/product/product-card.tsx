import Link from "next/link";
import type { CSSProperties } from "react";
import { ViewTransition } from "react";
import type { SerializedProductCard } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PriceBlock } from "@/components/product/price-block";
import { ProductImage } from "@/components/product/product-image";

export interface ProductCardProps {
  product: SerializedProductCard;
  className?: string;
  priority?: boolean;
  style?: CSSProperties;
}

export function ProductCard({ product, className, priority = false, style }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.slug}`}
      style={style}
      className={cn("group block focus:outline-none", className)}
    >
<ViewTransition name={`product-${product.slug}`} share="morph" default="none">
        <div className="relative overflow-hidden rounded-card bg-rose-mist ring-1 ring-transparent transition-all duration-300 group-hover:ring-ayli-peach/30 group-hover:shadow-soft">
          <ProductImage
            src={product.image}
            hoverSrc={product.imageHover}
            alt={product.imageAlt}
            priority={priority}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          {product.discountPercent > 0 ? (
            <Badge
              variant="discount"
              className="absolute left-2.5 top-2.5"
            >
              {product.discountPercent}% off
            </Badge>
          ) : null}
        </div>
      </ViewTransition>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-plum transition-colors duration-200">
          {product.name}
        </p>
        <PriceBlock
          mrp={product.mrp}
          sellingPrice={product.price}
          size="sm"
        />
        {product.colours > 1 ? (
          <p className="text-xs text-muted">{product.colours} colours</p>
        ) : null}
      </div>
    </Link>
  );
}
