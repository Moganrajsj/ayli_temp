"use client";

import { useMemo } from "react";

interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
}

const TESTIMONIALS_ROW_1: Testimonial[] = [
  {
    id: "t1",
    name: "Priyadharshini K.",
    city: "Chennai",
    rating: 5,
    quote:
      "Fabric quality semma soft-ah irukku! Fitting romba perfect. Office-kum casual wear-kum super comfortable. First time ordering, completely impressed with AYLI ❤️",
  },
  {
    id: "t2",
    name: "Soundarya Ramachandran",
    city: "Coimbatore",
    rating: 5,
    quote:
      "Delivery within 2 days vandhuruchu! Pure breathable cotton, Coimbatore heat-ku absolutely perfect. Color also didn't fade after washing. Worth every rupee!",
  },
  {
    id: "t3",
    name: "Nithya Sundaram",
    city: "Bengaluru",
    rating: 5,
    quote:
      "Ordered for a family function and the drape is stunning. The fabric feels luxurious against the skin, and the pockets are deep and practical! Really thoughtful design.",
  },
  {
    id: "t4",
    name: "Keerthana Muralidharan",
    city: "Madurai",
    rating: 5,
    quote:
      "Honestly intha price-ku ivlo premium quality expect pannala! Stitching and piping work romba neat. En friends ellarum ketanga engendhu vaangina nu!",
  },
];

const TESTIMONIALS_ROW_2: Testimonial[] = [
  {
    id: "t5",
    name: "Divya Bharathi S.",
    city: "Salem",
    rating: 5,
    quote:
      "Fabric touches like a dream! Day to evening easy-ah carry panlam. WhatsApp team was also so helpful with size suggestions. Next order already placed!",
  },
  {
    id: "t6",
    name: "Kavitha Rajendran",
    city: "Chennai",
    rating: 5,
    quote:
      "The attention to detail is remarkable — from the hand-rolled piping to the elegant cuts. It feels like wearing bespoke boutique designer clothing at an honest price.",
  },
  {
    id: "t7",
    name: "Abinaya Velumani",
    city: "Tiruchirappalli",
    rating: 5,
    quote:
      "Material quality super and fitting romba azhaga irukku. Packaging-um romba eco-friendly and neat-ah irundhuchu. AYLI will be my regular shop now!",
  },
  {
    id: "t8",
    name: "Sneha Balasubramanian",
    city: "Tirunelveli",
    rating: 5,
    quote:
      "Aylila order panna kurta set delivery aaiduchu. Romba soft cloth, even after full day wear in office, no wrinkles or itchiness. Super satisfied!",
  },
];

function WordPressTestimonialCard({ t }: { t: Testimonial }) {
  const initials = t.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="relative flex w-[320px] sm:w-[360px] shrink-0 flex-col justify-between rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ayli-peach/60 hover:shadow-md">
      {/* WordPress-style quote icon & star rating */}
      <div>
        <div className="flex items-center justify-between">
          {/* Decorative quote mark */}
          <svg
            className="h-6 w-6 text-ayli-peach/40"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>

          {/* Star rating */}
          <div className="flex items-center gap-0.5 text-gold text-sm">
            {Array.from({ length: t.rating }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
        </div>

        {/* Testimonial Quote */}
        <p className="mt-4 text-sm leading-relaxed text-neutral-700">
          &ldquo;{t.quote}&rdquo;
        </p>
      </div>

      {/* WordPress-style author meta block */}
      <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ayli-peach/30 bg-[#FFF2F5] font-display text-xs font-semibold text-plum">
          {initials}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 leading-tight">
            {t.name}
          </h4>
          <p className="text-xs text-neutral-500 mt-0.5">
            {t.city} <span className="text-neutral-300">&middot;</span> <span className="text-emerald-700 font-medium">Verified Buyer</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsMarquee() {
  const row1Items = useMemo(() => [...TESTIMONIALS_ROW_1, ...TESTIMONIALS_ROW_1], []);
  const row2Items = useMemo(() => [...TESTIMONIALS_ROW_2, ...TESTIMONIALS_ROW_2], []);

  return (
    <section className="relative overflow-hidden py-14 bg-gradient-to-b from-transparent via-[#FFF8FA]/50 to-transparent">
      {/* Clean, premium heading without unwanted text or tabs */}
      <div className="mx-auto max-w-7xl px-5 text-center mb-9">
        <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-ink">
          Words from Our <span className="font-serif italic font-normal text-plum">Clients</span>
        </h2>
      </div>

      {/* Moving Marquee Container */}
      <div className="relative w-full overflow-hidden space-y-4">
        {/* Soft edge gradient fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-32 bg-gradient-to-r from-warm-white via-warm-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-32 bg-gradient-to-l from-warm-white via-warm-white/80 to-transparent" />

        {/* Row 1 - Moving Left */}
        <div className="flex w-max gap-4 animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
          {row1Items.map((item, idx) => (
            <WordPressTestimonialCard key={`r1-${item.id}-${idx}`} t={item} />
          ))}
        </div>

        {/* Row 2 - Moving Right */}
        <div className="flex w-max gap-4 animate-[marquee-reverse_50s_linear_infinite] hover:[animation-play-state:paused]">
          {row2Items.map((item, idx) => (
            <WordPressTestimonialCard key={`r2-${item.id}-${idx}`} t={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
