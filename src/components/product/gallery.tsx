"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export interface GalleryImage {
  url: string;
  alt?: string | null;
}

export interface GalleryProps {
  images: GalleryImage[];
  className?: string;
}

/**
 * 4:5 swipeable product gallery. Scroll-snap carousel on all breakpoints;
 * arrows appear on sm+, dots always (when more than one image).
 */
export function Gallery({ images, className }: GalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index) setIndex(next);
  };

  const scrollTo = (target: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  };

  if (count === 0) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "grid aspect-[4/5] w-full place-items-center bg-soft-beige",
          className
        )}
      >
        <Icon name="sparkles" className="h-10 w-10 text-ayli-blue/40" />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, i) => (
          <div
            key={`${image.url}-${i}`}
            className="relative h-full w-full shrink-0 snap-start bg-soft-beige"
          >
            <Image
              src={image.url}
              alt={image.alt ?? `AYLI product view ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover animate-fade-in"
            />
          </div>
        ))}
      </div>

      {count > 1 ? (
        <>
          <div className="absolute right-3 top-3 rounded-pill bg-warm-white/90 px-2.5 py-1 text-xs font-medium text-ink shadow-soft">
            {index + 1} / {count}
          </div>
          <button
            type="button"
            aria-label="Previous image"
            disabled={index === 0}
            onClick={() => scrollTo(index - 1)}
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-warm-white/90 text-ink shadow-soft transition-opacity disabled:pointer-events-none disabled:opacity-0"
          >
            <Icon name="chevron-left" className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            disabled={index === count - 1}
            onClick={() => scrollTo(index + 1)}
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-warm-white/90 text-ink shadow-soft transition-opacity disabled:pointer-events-none disabled:opacity-0"
          >
            <Icon name="chevron-right" className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-pill transition-all duration-300",
                  i === index ? "w-6 bg-ayli-blue" : "w-1.5 bg-ink/25"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}