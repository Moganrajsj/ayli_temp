import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "AYLI offers 7-day returns with mandatory unboxing video proof. Learn how to initiate a return and what to expect.",
  alternates: { canonical: `${SITE_URL}/return-refund` },
};

export default function ReturnRefundPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Return & Refund Policy
        </h1>
        <p className="mt-1 text-sm text-muted">Last updated: October 2026</p>

        <div className="mt-8 space-y-8">
          <section className="rounded-card border border-success/30 bg-success/5 p-6">
            <h2 className="font-display text-lg font-semibold text-success">Our promise</h2>
            <p className="mt-2 text-base leading-relaxed text-ink/85">
              Not quite right? Submit a return request within <strong>7 days of delivery</strong> with
              a valid unboxing video, as long as the item is unworn, unwashed, and has all original tags attached.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">How to initiate a return</h2>
            <ol className="mt-2 list-decimal space-y-3 pl-5 leading-relaxed">
              <li>Go to <a href="/account/orders" className="font-medium text-ayli-blue hover:underline">My Orders</a> and select the delivered order.</li>
              <li>Click &quot;Request Return / Exchange&quot; (active for 7 days post-delivery).</li>
              <li>Select the item(s), choose the reason, and upload your mandatory unboxing video (opening sealed package).</li>
              <li>Our team reviews the video and approves the return within 24 hours.</li>
              <li>Pack the item securely in its original packaging and hand it to the courier.</li>
              <li>Once received and verified, your refund is processed.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Refund timeline</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
              <li><strong>Credit/debit card:</strong> 5–7 business days after refund is initiated</li>
              <li><strong>UPI / netbanking:</strong> 3–5 business days</li>
              <li><strong>AYLI store credit:</strong> Instant — added to your account balance</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">What can be returned</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
              <li>All apparel (kurtis, dresses, sets, bottoms) — unworn with original tags</li>
              <li>Accessories — unused, in original packaging</li>
              <li>Gift cards — not eligible for return</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Exchanges</h2>
            <p className="mt-2 leading-relaxed">
              We don&apos;t currently offer direct exchanges. To swap a size or colour, return the original
              item and place a new order. Store credit makes this seamless and instant.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Damaged or defective items</h2>
            <p className="mt-2 leading-relaxed">
              If you receive a damaged, defective or wrong item, contact us on WhatsApp within 48 hours
              with a photo. We&apos;ll arrange an immediate pickup and send the correct item at no extra
              cost.
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}