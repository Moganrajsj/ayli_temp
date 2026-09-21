import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of service for shopping at AYLI.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Terms & Conditions</h1>
        <p className="mt-1 text-sm text-muted">Effective date: September 2026</p>

        <article className="mt-8 space-y-6 text-base leading-relaxed text-ink/85">
          <p>
            By accessing or using the AYLI website (ayli.in) and placing an order, you agree to the
            following terms. Please read them carefully before making a purchase.
          </p>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. Account & eligibility</h2>
            <p className="mt-2">
              You must be 18 years or older to create an account. You are responsible for
              maintaining the confidentiality of your credentials and for all activity under your
              account. We reserve the right to suspend accounts involved in fraudulent activity.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. Products & pricing</h2>
            <p className="mt-2">
              All prices are in Indian Rupees (INR) and include applicable taxes. We strive for
              accurate product descriptions and photography, but slight variations in colour may occur
              due to screen settings. Product availability is subject to change without notice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Orders & payment</h2>
            <p className="mt-2">
              Placing an order is an offer to buy. We may confirm or decline an order; payment is
              collected only after confirmation. Accepted payment methods include UPI, debit/credit
              cards and netbanking via Razorpay. A failed or declined payment does not constitute
              a completed order.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. Shipping & delivery</h2>
            <p className="mt-2">
              Standard shipping is free on orders above ₹999. Express shipping is available at ₹99
              extra. Dispatch occurs within 24 hours on business days. Delivery timelines are estimates
              and not guaranteed. Risk of loss transfers to you upon delivery to the address provided.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">5. Returns & refunds</h2>
            <p className="mt-2">
              Please refer to our <a href="/return-refund" className="font-medium text-ayli-blue hover:underline">Return &amp; Refund Policy</a> for
              full details. Items must be returned within 15 days of delivery in unworn, original
              condition. Refunds are processed to the original payment method within 5–7 business
              days of receiving the return.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">6. Intellectual property</h2>
            <p className="mt-2">
              All content on this site — including logos, product photography, text and design — is
              the property of AYLI and protected under Indian intellectual property law. You may not
              reproduce or redistribute any content without written permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">7. Limitation of liability</h2>
            <p className="mt-2">
              AYLI is not liable for indirect, incidental or consequential damages arising from the
              use of our products or website. Our total liability for any claim shall not exceed the
              amount you paid for the product in question.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">8. Governing law</h2>
            <p className="mt-2">
              These terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of courts in the city where AYLI is registered.
            </p>
          </section>
        </article>
      </PageContainer>
    </div>
  );
}