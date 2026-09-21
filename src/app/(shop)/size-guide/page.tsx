import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "AYLI size chart with body measurements in cm — find your perfect fit across kurtis, dresses and bottoms.",
  alternates: { canonical: `${SITE_URL}/size-guide` },
};

const TOP_SIZES = [
  { size: "XS", bust: "30–31", waist: "24–25", hip: "33–34" },
  { size: "S", bust: "32–33", waist: "26–27", hip: "35–36" },
  { size: "M", bust: "34–35", waist: "28–29", hip: "37–38" },
  { size: "L", bust: "36–37", waist: "30–31", hip: "39–40" },
  { size: "XL", bust: "38–39", waist: "32–33", hip: "41–42" },
  { size: "XXL", bust: "40–41", waist: "34–35", hip: "43–44" },
];

const BOTTOM_SIZES = [
  { size: "XS", waist: "24–25", hip: "33–34", inseam: "36" },
  { size: "S", waist: "26–27", hip: "35–36", inseam: "36" },
  { size: "M", waist: "28–29", hip: "37–38", inseam: "37" },
  { size: "L", waist: "30–31", hip: "39–40", inseam: "37" },
  { size: "XL", waist: "32–33", hip: "41–42", inseam: "38" },
  { size: "XXL", waist: "34–35", hip: "43–44", inseam: "38" },
];

function SizeTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">All measurements are in centimetres (cm).</p>
      <div className="mt-4 overflow-x-auto rounded-card border border-hairline">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-soft-beige text-xs uppercase tracking-widest text-muted">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/70">
            {rows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-soft-beige/40">
                {row.map((cell, j) => (
                  <td key={j} className={`px-4 py-3 ${j === 0 ? "font-semibold text-ink" : "text-muted"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function SizeGuidePage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Size Guide</h1>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-muted">
          AYLI sizes are designed for real Indian body types. If you&apos;re between sizes, we generally
          recommend going one size up — our fabrics have a relaxed, comfortable drape.
        </p>

        <div className="mt-10 flex flex-col gap-12">
          <SizeTable
            title="Kurtis, tops & dresses"
            headers={["Size", "Bust", "Waist", "Hip"]}
            rows={TOP_SIZES.map((s) => [s.size, s.bust, s.waist, s.hip])}
          />
          <SizeTable
            title="Bottoms"
            headers={["Size", "Waist", "Hip", "Inseam"]}
            rows={BOTTOM_SIZES.map((s) => [s.size, s.waist, s.hip, `${s.inseam} cm`])}
          />
        </div>

        <section className="mt-12 rounded-card bg-soft-beige p-6">
          <h2 className="font-display text-lg font-semibold text-ink">How to measure</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/85">
            <li><strong>Bust:</strong> Measure around the fullest part of your chest, keeping the tape level.</li>
            <li><strong>Waist:</strong> Measure around the narrowest part of your natural waistline.</li>
            <li><strong>Hip:</strong> Measure around the fullest part of your hips and seat.</li>
            <li><strong>Inseam:</strong> Measure from the crotch seam to the bottom of the leg opening.</li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            Each product page also lists specific garment measurements for that particular style — we
            recommend checking those first as fits can vary slightly between designs.
          </p>
        </section>
      </PageContainer>
    </div>
  );
}