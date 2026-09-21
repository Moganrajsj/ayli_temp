import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with AYLI for sizing help, styling advice, order queries and more.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Get in touch</h1>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-muted">
          Whether you need help picking a size, tracking an order or placing a bulk inquiry — we&apos;re here for you.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <section className="rounded-card border border-hairline bg-warm-white p-6">
            <h2 className="font-display text-lg font-semibold text-ink">WhatsApp</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Fastest way to reach us. We reply within minutes during business hours (10am – 7pm IST).
            </p>
            <div className="mt-4">
              <WhatsAppButton message="Hi AYLI, I need help with an order" variant="peach" />
            </div>
          </section>
          <section className="rounded-card border border-hairline bg-warm-white p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Email</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              For detailed queries, partnerships or press:
            </p>
            <p className="mt-3 font-medium text-ayli-blue">hello@ayli.in</p>
            <p className="mt-1 text-sm text-muted">
              We respond within 24 hours on business days.
            </p>
          </section>
        </div>

        <section className="mt-10 rounded-card bg-soft-beige p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink">Quick answers</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-ink">What&apos;s your size?</dt>
              <dd className="mt-1 text-muted">
                Check our <a href="/size-guide" className="font-medium text-ayli-blue hover:underline">size guide</a> — all measurements are in cm for each style.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Where&apos;s my order?</dt>
              <dd className="mt-1 text-muted">
                Go to <a href="/account/orders" className="font-medium text-ayli-blue hover:underline">My Orders</a> for real-time status tracking.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Returns & exchanges?</dt>
              <dd className="mt-1 text-muted">
                See our <a href="/return-refund" className="font-medium text-ayli-blue hover:underline">return policy</a> — most items can be returned within 15 days.
              </dd>
            </div>
          </dl>
        </section>
      </PageContainer>
    </div>
  );
}