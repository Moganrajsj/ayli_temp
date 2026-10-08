import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn about how AYLI uses essential session cookies to provide a secure shopping experience.",
  alternates: { canonical: `${SITE_URL}/cookie-policy` },
};

export default function CookiePolicyPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Cookie Policy
        </h1>
        <p className="mt-1 text-sm text-muted">Last updated: September 2026</p>

        <div className="mt-8 space-y-8">
          <section className="rounded-card border border-hairline bg-warm-white p-6">
            <h2 className="font-display text-lg font-semibold text-ink">What are cookies?</h2>
            <p className="mt-2 text-base leading-relaxed text-ink/85">
              Cookies are small text files placed on your device by websites you visit. They help make websites work efficiently and provide essential functional capabilities, such as keeping track of items in your shopping bag and maintaining your account session.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. How AYLI Uses Cookies</h2>
            <p className="mt-2 leading-relaxed">
              AYLI uses strictly necessary cookies and functional session cookies to ensure you can browse products, manage your bag, and complete secure checkouts:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              <li><strong>Essential Session Cookies:</strong> Used to maintain your signed-in account state securely across pages.</li>
              <li><strong>Shopping Bag Cookies:</strong> Used to remember your selected items while browsing as a guest before checkout.</li>
              <li><strong>Security Cookies:</strong> Used to protect against Cross-Site Request Forgery (CSRF) and unauthorized access.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. Privacy & Third-Party Cookies</h2>
            <p className="mt-2 leading-relaxed">
              We respect your privacy. AYLI does not silently enable non-essential third-party tracking cookies or sell user browsing data to advertisers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Managing Your Cookies</h2>
            <p className="mt-2 leading-relaxed">
              You can choose to disable cookies in your web browser settings. However, please note that disabling essential session cookies may prevent you from adding items to your bag, signing into your account, or placing orders.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. Contact Us</h2>
            <p className="mt-2 leading-relaxed">
              If you have any questions regarding our Cookie Policy, please visit our <a href="/privacy-policy" className="text-ayli-blue underline">Privacy Policy</a> or contact us via <a href="/contact" className="text-ayli-blue underline">Contact Us</a>.
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}
