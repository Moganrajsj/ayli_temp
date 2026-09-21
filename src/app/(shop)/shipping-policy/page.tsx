import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "AYLI shipping options, delivery timelines, and charges — free shipping on orders above ₹999.",
  alternates: { canonical: `${SITE_URL}/shipping-policy` },
};

export default function ShippingPolicyPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Shipping Policy</h1>
        <p className="mt-1 text-sm text-muted">Last updated: September 2026</p>

        <div className="mt-8 space-y-8">
          <section className="rounded-card border border-hairline bg-warm-white p-6">
            <h2 className="font-display text-xl font-semibold text-ink">At a glance</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-card bg-soft-beige p-4">
                <p className="text-sm font-semibold text-ink">Standard shipping</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ayli-blue">
                  {`Free ≥ ₹999 · ₹99`}
                </p>
                <p className="mt-1 text-sm text-muted">3–5 business days</p>
              </div>
              <div className="rounded-card bg-soft-beige p-4">
                <p className="text-sm font-semibold text-ink">Express shipping</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ayli-blue">₹198</p>
                <p className="mt-1 text-sm text-muted">1–2 business days</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Dispatch & processing</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
              <li>Orders placed before 4pm IST are dispatched same day (business days)</li>
              <li>Orders placed after 4pm IST or on weekends/holidays ship the next business day</li>
              <li>You&apos;ll receive an email and WhatsApp notification with tracking details once dispatched</li>
              <li>Delivery timelines begin from the date of dispatch, not the date of order</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Delivery coverage</h2>
            <p className="mt-2 leading-relaxed">
              We deliver across India, including all pin codes served by our logistics partners. Remote
              areas may experience 1–2 additional business days. For delivery outside India, please
              contact us before placing an order.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Order tracking</h2>
            <p className="mt-2 leading-relaxed">
              Track your order in real time from your{' '}
              <a href="/account/orders" className="font-medium text-ayli-blue hover:underline">
                My Orders
              </a>{' '}
              page. You will also receive SMS and email updates at each step: dispatched, in transit,
              out for delivery, and delivered.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Undeliverable packages</h2>
            <p className="mt-2 leading-relaxed">
              If a package is returned to us due to an incorrect address, unavailability or refusal, we
              will contact you to arrange redelivery. Two failed attempts will result in a refund to
              your original payment method minus any shipping charges incurred.
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}