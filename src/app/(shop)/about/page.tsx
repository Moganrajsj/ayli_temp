import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "About AYLI",
  description:
    "AYLI is a premium women's fashion brand crafting kurtis, co-ord sets, dresses and more for the modern Indian woman.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          The story behind AYLI
        </h1>
        <p className="mt-1 text-sm text-muted">Est. 2026 · Made for Indian women, by Indian women.</p>

        <article className="mt-8 space-y-6 text-base leading-relaxed text-ink/85">
          <p>
            AYLI was born from a simple frustration: finding beautiful, well-made clothing that doesn&apos;t
            feel like a compromise. We wanted pieces that transition from a busy weekday to a casual
            dinner without missing a beat — designed for Indian women who move through their day with
            purpose.
          </p>
          <p>
            Every fabric is chosen for how it feels against the skin. Every silhouette is refined through
            hundreds of fittings. Every print is made to order — never copied, never mass-market.
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            What we care about
          </h2>
          <p>
            We partner with artisan-led mills and small-batch factories across India. Rayon from
            Bhilwara. Hand-block from Jaipur. Chanderi from Madhya Pradesh. We work at the pace of
            craft, not the pace of trends.
          </p>
          <p>
            That means smaller runs, no deadstock, and clothing that is made to be worn — not just
            photographed. AYLI pieces are built to last through seasons, wash after wash.
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Our promise
          </h2>
          <ul className="list-disc space-y-3 pl-5">
            <li>Fabrics you can actually breathe in — Indian summers are real</li>
            <li>True-to-size fits — no guessing, no gambling</li>
            <li>Shipping within 24 hours — because you have a life to get back to</li>
            <li>15-day hassle-free returns — because we know you want to touch it first</li>
            <li>Prices that make sense — no artificial markdowns, just honest value</li>
          </ul>
        </article>
      </PageContainer>
    </div>
  );
}