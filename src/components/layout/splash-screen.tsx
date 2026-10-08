"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function SplashScreen() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // Automatically unmount after the splash slide-up finishes (3.1s)
    const timer = setTimeout(() => {
      setMounted(false);
    }, 3100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMounted(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Never display on administrative pages
  if (!mounted || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      id="splash"
      onClick={() => setMounted(false)}
      role="status"
      aria-live="polite"
      aria-label="Loading AYLI"
      className="cursor-pointer"
    >
      {/* Brand logo in center */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white select-none">
        <h1 className="font-display text-3xl font-light tracking-[0.3em] uppercase text-white sm:text-4xl drop-shadow-sm">
          AYLI
        </h1>
        <p className="mt-1 font-body text-[11px] tracking-[0.25em] uppercase text-white/85">
          Women&apos;s Fashion
        </p>
      </div>

      {/* Airplane flight animation */}
      <div className="anim pointer-events-none">
        <div id="loader">
          <svg version="1.1" width="60px" height="70px" viewBox="0 0 60 70">
            <defs>
              <filter id="f1" x="0" y="0">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              </filter>
            </defs>
            <g id="airplane">
              <path
                fill="#18181b"
                d="M0.677,20.977l4.355,1.631c0.281,0.104,0.579,0.162,0.88,0.16l9.76-0.004L30.46,41.58c0.27,0.34,0.679,0.545,1.112,0.541
                h1.87c0.992,0,1.676-0.992,1.322-1.918l-6.643-17.439l6.914,0.002l6.038,6.037c0.265,0.266,0.624,0.412,0.999,0.418l1.013-0.004
                c1.004-0.002,1.684-1.012,1.312-1.938l-2.911-7.277l2.912-7.278c0.372-0.928-0.313-1.941-1.313-1.938h1.017
                c-0.375,0-0.732,0.15-0.996,0.414l-6.039,6.039h-6.915l6.646-17.443c0.354-0.926-0.33-1.916-1.321-1.914l-1.87-0.004
                c-0.439,0.004-0.843,0.203-1.112,0.543L15.677,17.24l-9.765-0.002c-0.3,0.002-0.597,0.055-0.879,0.16L0.678,19.03
                C-0.225,19.36-0.228,20.637,0.677,20.977z"
                transform="translate(44,0) rotate(90 0 0)"
              />
            </g>
            <g id="shadow" transform="scale(.9)">
              <path
                fill="#000"
                fillOpacity="0.3"
                d="M0.677,20.977l4.355,1.631c0.281,0.104,0.579,0.162,0.88,0.16l9.76-0.004L30.46,41.58c0.27,0.34,0.679,0.545,1.112,0.541
                h1.87c0.992,0,1.676-0.992,1.322-1.918l-6.643-17.439l6.914,0.002l6.038,6.037c0.265,0.266,0.624,0.412,0.999,0.418l1.013-0.004
                c1.004-0.002,1.684-1.012,1.312-1.938l-2.911-7.277l2.912-7.278c0.372-0.928-0.313-1.941-1.313-1.938h1.017
                c-0.375,0-0.732,0.15-0.996,0.414l-6.039,6.039h-6.915l6.646-17.443c0.354-0.926-0.33-1.916-1.321-1.914l-1.87-0.004
                c-0.439,0.004-0.843,0.203-1.112,0.543L15.677,17.24l-9.765-0.002c-0.3,0.002-0.597,0.055-0.879,0.16L0.678,19.03
                C-0.225,19.36-0.228,20.637,0.677,20.977z"
                transform="translate(64,30) rotate(90 0 0)"
                filter="url(#f1)"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Discreet click to skip badge */}
      <div className="absolute bottom-6 right-6 z-10 text-[11px] font-medium tracking-wider text-white/60 hover:text-white transition-colors">
        Click anywhere or Esc to skip &rarr;
      </div>
    </div>
  );
}
