"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";

interface Slide {
  src: string;
  alt: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
}

const SLIDES: Slide[] = [
  {
    src: "/images/hero/hero-01.png",
    alt: "AYLI womenswear campaign banner",
    title: "New season signatures",
    ctaLabel: "Shop now",
    ctaHref: "/collection/new-arrivals",
  },
  {
    src: "/images/hero/hero-02.png",
    alt: "AYLI womenswear campaign banner",
    title: "Trending right now",
    ctaLabel: "Shop now",
    ctaHref: "/collection/trending-now",
  },
  {
    src: "/images/hero/hero-03.png",
    alt: "AYLI womenswear campaign banner",
    title: "Our most-loved picks",
    ctaLabel: "Shop now",
    ctaHref: "/collection/bestsellers",
  },
  {
    src: "/images/hero/hero-04.png",
    alt: "AYLI womenswear campaign banner",
    title: "Quietly made to last",
    ctaLabel: "Shop now",
    ctaHref: "/collection/bestsellers",
  },
  {
    src: "/images/hero/hero-05.png",
    alt: "AYLI womenswear campaign banner",
    title: "Everyday, elevated",
    ctaLabel: "Shop now",
    ctaHref: "/collection/trending-now",
  },
  {
    src: "/images/hero/hero-06.png",
    alt: "AYLI womenswear campaign banner",
    title: "Details worth noticing",
    ctaLabel: "Shop now",
    ctaHref: "/collection/new-arrivals",
  },
];

const INTERVAL_MS = 5000;
const LOCK_MS = 700;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const userPausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === current) return;
      setIsAnimating(true);
      setCurrent(index);
      setTimeout(() => setIsAnimating(false), LOCK_MS);
    },
    [isAnimating, current]
  );

  const goNext = useCallback(() => {
    goTo((current + 1) % SLIDES.length);
  }, [current, goTo]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length);
  }, [current, goTo]);

// Auto-advance only runs while unpaused and the user hasn't asked for
// reduced motion (WCAG 2.2.2 Pause, Stop, Hide).
useEffect(() => {
  if (paused || prefersReducedMotion()) return;
  timerRef.current = setInterval(goNext, INTERVAL_MS);
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [goNext, paused]);

  // Pause/resume helpers — hover/focus only re-shape autoplay when the user
  // hasn't explicitly toggled the pause control.
  const pause = useCallback(() => {
    if (!userPausedRef.current) setPaused(true);
  }, []);
  const resume = useCallback(() => {
    if (!userPausedRef.current) setPaused(false);
  }, []);
  const togglePaused = () => {
    userPausedRef.current = !paused;
    setPaused((p) => !p);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleDotClick = (i: number) => {
    goTo(i);
    resume();
  };

  const slide = SLIDES[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label="Hero fashion carousel"
    >
      <div
        className="relative w-full overflow-hidden aspect-[16/9]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocusCapture={pause}
        onBlurCapture={resume}
      >
        {/* All slide art is authored at 1920x1080 (16:9) and the frame is 16:9 at
            every breakpoint, so `object-cover` never crops a pixel. */}
        {SLIDES.map((s, i) => (
          <Link
            key={s.src}
            href={s.ctaHref}
            aria-label={`${s.title} — ${s.ctaLabel}`}
            tabIndex={i === current ? 0 : -1}
            aria-hidden={i !== current}
            className="group absolute inset-0 block transition-opacity duration-700 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
            style={{
              opacity: i === current ? 1 : 0,
              zIndex: i === current ? 2 : 1,
            }}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              preload={i === 0}
              sizes="100vw"
              className="object-cover object-center animate-fade-in"
              draggable={false}
            />
          </Link>
        ))}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/25 via-transparent to-black/70" />

        {/* Slide CTA — the only text on the banner. Dots sit in the flow (not
            absolutely positioned) so they can never overlap the button in a
            short 16:9 frame, and they stay outside the keyed block so keyboard
            focus survives autoplay. `title` is no longer rendered visually but
            still names each slide link for screen readers. */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2.5 px-4 pb-4 sm:gap-4 sm:pb-8">
          <div
            className="flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Slide indicators"
          >
            {SLIDES.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => handleDotClick(i)}
                className={[
                  "rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70",
                  i === current
                    ? "h-1.5 w-6 bg-white"
                    : "h-1.5 w-1.5 bg-white/40 hover:bg-white/65",
                ].join(" ")}
              />
            ))}
          </div>

          <div key={current} className="flex flex-col items-center">
            <Link
              href={slide.ctaHref}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink shadow-lg transition-all duration-300 hover:bg-ayli-peach hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:px-7 sm:py-3 sm:text-xs"
            >
              {slide.ctaLabel}
              <Icon
                name="arrow-right"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        {/* Pause/play control */}
        <button
          type="button"
          onClick={togglePaused}
          aria-pressed={paused}
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          className="absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-full bg-black/25 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          {paused ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <rect x="7" y="6" width="3.4" height="12" rx="1" />
              <rect x="13.6" y="6" width="3.4" height="12" rx="1" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}