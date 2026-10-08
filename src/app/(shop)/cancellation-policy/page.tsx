import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description:
    "Learn about AYLI order cancellation rules, timelines, and refund terms.",
  alternates: { canonical: `${SITE_URL}/cancellation-policy` },
};

export default function CancellationPolicyPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Cancellation Policy
        </h1>
        <p className="mt-1 text-sm text-muted">Last updated: September 2026</p>

        <div className="mt-8 space-y-8">
          <section className="rounded-card border border-ayli-blue/30 bg-ayli-blue/5 p-6">
            <h2 className="font-display text-lg font-semibold text-ayli-blue">Easy order cancellations</h2>
            <p className="mt-2 text-base leading-relaxed text-ink/85">
              We know plans change! You can cancel your order at any time before it enters the <strong>Packed</strong> or <strong>Shipped</strong> stage directly from your AYLI account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. Cancellation Timelines</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
              <li><strong>Pending / Unpaid Orders:</strong> Can be cancelled instantly from your account order page.</li>
              <li><strong>Confirmed Orders:</strong> Can be cancelled as long as the order status is still marked as <em>Confirmed</em> and has not been packed or dispatched.</li>
              <li><strong>Shipped Orders:</strong> Once an order is handed over to our courier partner (<em>Packed</em> or <em>Shipped</em>), it cannot be cancelled. You may request a return upon delivery under our <a href="/return-refund" className="text-ayli-blue underline">Return Policy</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. How to Cancel Your Order</h2>
            <ol className="mt-2 list-decimal space-y-3 pl-5 leading-relaxed">
              <li>Log into your account and navigate to <a href="/account/orders" className="font-medium text-ayli-blue hover:underline">My Orders</a>.</li>
              <li>Select the order you wish to cancel to open the order details.</li>
              <li>Click the <strong>Cancel Order</strong> button and confirm your cancellation.</li>
              <li>You will receive an instant confirmation on screen and an updated order status.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Cancellation Refunds</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
              <li><strong>Prepaid Orders (UPI, Netbanking, Cards):</strong> For eligible prepaid cancellations, an automated refund is initiated immediately to your original payment method. Refunds reflect within 3–7 business days depending on your bank.</li>
              <li><strong>Failed / Abandoned Checkout:</strong> If payment was not completed, no amount was charged, and reserved items are automatically released.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. Need Assistance?</h2>
            <p className="mt-2 leading-relaxed">
              If you have any questions or require urgent cancellation assistance, please contact our support team via <a href="/contact" className="text-ayli-blue underline">Contact Us</a> or message us on WhatsApp.
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}
