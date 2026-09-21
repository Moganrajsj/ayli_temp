import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Care Guide",
  description:
    "How to wash, dry and store your AYLI pieces to keep them looking beautiful season after season.",
  alternates: { canonical: `${SITE_URL}/care-guide` },
};

const TIPS = [
  {
    title: "Rayon & viscose",
    content:
      "Hand wash cold (30°C max) with mild detergent. Do not wring — gently squeeze and lay flat to dry. Iron on low heat while slightly damp. These fabrics shrink with machine wash and high heat.",
  },
  {
    title: "Cotton",
    content:
      "Machine wash cold or lukewarm on a gentle cycle. Tumble dry on low or line dry. Iron on medium-high heat. Cotton wrinkles naturally — embrace the lived-in look or steam for a polished finish.",
  },
  {
    title: "Silk blends",
    content:
      "Hand wash in cold water with silk-safe detergent or dry clean. Never use hot water or bleach. Iron on the lowest setting inside out, or use a pressing cloth. Store in a breathable garment bag.",
  },
  {
    title: "Chanderi & handloom",
    content:
      "Dry clean recommended for the first wash. Subsequent washes can be hand washed cold with gentle detergent. Do not soak. Dry flat in shade to preserve colour. Iron on low heat.",
  },
  {
    title: "Synthetic & blended fabrics",
    content:
      "Machine wash cold on a gentle cycle. Avoid bleach and fabric softeners. Hang to dry or tumble dry on low. Iron on low heat if needed, or use a steamer.",
  },
];

export default function CareGuidePage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Care Guide</h1>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-muted">
          A little care goes a long way. Here&apos;s how to keep your AYLI pieces looking and feeling
          their best — wash after wash.
        </p>

        <section className="mt-8 rounded-card border border-hairline bg-warm-white p-6">
          <h2 className="font-display text-lg font-semibold text-ink">General rules</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/85">
            <li>Always check the care label first — it has specific instructions for that garment</li>
            <li>Turn clothes inside out before washing to protect the outer surface</li>
            <li>Wash dark and light colours separately to prevent colour transfer</li>
            <li>Use mild, pH-neutral detergent — harsh chemicals break down natural fibres</li>
            <li>Avoid prolonged sun exposure while drying — UV fades dyes over time</li>
            <li>Store kurtis and dresses on padded hangers to maintain shoulder shape</li>
          </ul>
        </section>

        <div className="mt-10 flex flex-col gap-8">
          {TIPS.map((tip) => (
            <section key={tip.title}>
              <h2 className="font-display text-xl font-semibold text-ink">{tip.title}</h2>
              <p className="mt-2 text-base leading-relaxed text-ink/85">{tip.content}</p>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-card bg-soft-beige p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Stain removal</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">
            For most fresh stains, blot (don&apos;t rub) with cold water immediately. Apply a small amount
            of mild detergent directly to the stain and let it sit for 15 minutes before washing. For
            stubborn stains like turmeric or oil, a paste of baking soda and cold water applied
            overnight often helps. When in doubt, take it to a professional cleaner.
          </p>
        </section>
      </PageContainer>
    </div>
  );
}