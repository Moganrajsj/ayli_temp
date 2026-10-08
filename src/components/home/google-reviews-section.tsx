import { Icon } from "@/components/ui/icons";
import { AnimateOnMount } from "@/components/ui/motion";
import { GoogleReviewsWidget } from "@/components/home/google-reviews-widget";

export function GoogleReviewsSection() {
  const widgetId = process.env.NEXT_PUBLIC_ELFSIGHT_WIDGET_ID;

  // Without a widget there is nothing to show, so the section hides entirely
  // rather than leaving a heading with no content under it.
  if (!widgetId) return null;

  return (
    <section
      aria-labelledby="ayli-love-heading"
      className="relative overflow-hidden bg-warm-white py-14 sm:py-20 lg:py-24"
    >
      {/* Decorative wash — static, purely ornamental */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-4 h-56 w-56 rounded-full bg-ayli-peach/10 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-ayli-blue/10 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute inset-x-6 top-0 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-hairline to-transparent" />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <AnimateOnMount className="text-center">
          <h2
            id="ayli-love-heading"
            className="font-display text-3xl font-semibold tracking-[0.12em] text-ink sm:text-4xl sm:tracking-[0.18em] lg:text-5xl lg:tracking-[0.16em]"
          >
            THE AYLI LOVE
          </h2>

          <div className="mt-5 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                name="star"
                solid
                className="h-4 w-4 text-gold sm:h-[18px] sm:w-[18px] lg:h-5 lg:w-5"
              />
            ))}
          </div>
        </AnimateOnMount>

        <AnimateOnMount delay={140} className="mt-10 sm:mt-12">
          <GoogleReviewsWidget widgetId={widgetId} className="mx-auto max-w-6xl" />
        </AnimateOnMount>
      </div>
    </section>
  );
}
