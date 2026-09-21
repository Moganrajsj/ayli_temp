import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How AYLI collects, uses and protects your personal information.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted">Last updated: September 2026</p>

        <article className="mt-8 space-y-6 text-base leading-relaxed text-ink/85">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Information we collect</h2>
            <p className="mt-2">
              When you create an account, place an order or contact us, we collect your name, email
              address, phone number, shipping/billing addresses, order history and any information
              you voluntarily provide in messages.
            </p>
            <p className="mt-2">
              We also collect certain technical data automatically — including your IP address, browser
              type and page views — to maintain and improve our website. We use session cookies for
              authentication and cart persistence. No third-party tracking cookies are used for
              advertising.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">How we use your information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To process and fulfil your orders, including payment processing and shipping</li>
              <li>To communicate order updates, delivery status and customer support replies</li>
              <li>To personalise your browsing experience and show you relevant products</li>
              <li>To detect and prevent fraud and abuse of our platform</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Information sharing</h2>
            <p className="mt-2">
              We share your information only with payment processors (Razorpay), shipping partners
              and technology providers that help us operate. We do not sell your data to advertisers
              or data brokers. Information may be disclosed if required by Indian law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Data security</h2>
            <p className="mt-2">
              We use industry-standard encryption and secure infrastructure. Payment card data is
              handled exclusively by Razorpay — we never store card numbers on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Your rights</h2>
            <p className="mt-2">
              You can view, update or delete your account information at any time from your account
              settings. For any data-related requests, email us at hello@ayli.in.
            </p>
          </section>
        </article>
      </PageContainer>
    </div>
  );
}