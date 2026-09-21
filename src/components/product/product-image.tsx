import Image from "next/image";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export interface ProductImageProps {
  src?: string | null;
  hoverSrc?: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * 4:5 product image field. Renders a branded placeholder when the product has
 * no image yet (common in early seed stages). When `hoverSrc` is provided the
 * second image crossfades in on hover (desktop).
 */
export function ProductImage({
  src,
  hoverSrc,
  alt = "AYLI",
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
}: ProductImageProps) {
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "grid aspect-[4/5] w-full place-items-center bg-soft-beige",
          className
        )}
      >
        <Icon name="sparkles" className="h-8 w-8 text-ayli-blue/40" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden bg-soft-beige",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover animate-fade-in"
      />
      {hoverSrc ? (
        <Image
          src={hoverSrc}
          alt={alt}
          fill
          priority={false}
          sizes={sizes}
          className="object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
        />
      ) : null}
    </div>
  );
}