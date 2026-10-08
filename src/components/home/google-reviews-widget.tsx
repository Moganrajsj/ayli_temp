"use client";

import Script from "next/script";

const PLATFORM_SRC = "https://elfsightcdn.com/platform.js";

/* Elfsight's install snippet is a platform script plus a host div named
   `elfsight-app-<widgetId>`. The `data-elfsight-app-lazy` attribute makes the
   platform initialise the widget only when it nears the viewport, so the script
   itself is enough — no client-side observer needed. Without a widget id
   nothing renders and the section hides itself. */
export function GoogleReviewsWidget({
  widgetId,
  className,
}: {
  widgetId?: string;
  className?: string;
}) {
  if (!widgetId) return null;

  return (
    <div className={className}>
      <Script src={PLATFORM_SRC} strategy="afterInteractive" async />
      <div
        className={`elfsight-app-${widgetId} min-h-[240px] w-full`}
        data-elfsight-app-lazy
      />
    </div>
  );
}
