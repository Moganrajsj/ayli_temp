import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SITE_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Quick answers to common questions about ordering, shipping, sizing, returns and payments at AYLI.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

const FAQS = [
  {
    q: "How do I find the right size?",
    a: "Check the size guide on each product page — all measurements are in centimetres for that specific style. If you're between sizes, we recommend going one size up. Our fabrics have a relaxed drape.",
  },
  {
    q: "Can I try the item before buying?",
    a: "AYLI is an online-only brand, which is why we offer 15-day hassle-free returns. Order your preferred size, try it at home, and return it for a full refund if it's not right.",
  },
  {
    q: "What fabrics do you use?",
    a: "We work primarily with rayon, cotton, silk blends and Chanderi — fabrics chosen for breathability, drape and how they feel against Indian skin in warm climates. Each product page lists the exact fabric and care instructions.",
  },
  {
    q: "How long does shipping take?",
    a: "Orders are dispatched within 24 hours on business days. Standard delivery takes 3–5 business days; express delivery (1–2 days) is available at checkout. Free standard shipping on orders above ₹999.",
  },
  {
    q: "Can I pay on delivery (COD)?",
    a: "Not currently. We accept UPI, credit/debit cards and netbanking via Razorpay — all secure and instant. We're evaluating COD for future releases.",
  },
  {
    q: "How do I track my order?",
    a: "Once dispatched, you'll receive an email and SMS with your tracking link. You can also track all orders in real time from the My Orders section of your account.",
  },
  {
    q: "What's your return policy?",
    a: "You can return any unworn item with original tags attached within 15 days of delivery. We'll send a prepaid return label — no shipping charges to you. Refunds are processed within 5–7 business days.",
  },
  {
    q: "Do you offer exchanges?",
    a: "We don't offer direct exchanges yet. Return the original item for a refund or store credit, and place a new order for the size or colour you prefer. Store credit is instant.",
  },
  {
    q: "Are the colours exactly as shown on screen?",
    a: "We photograph all items under natural light for accuracy, but slight differences may occur due to screen settings and display calibration. Our return policy covers this — send it back within 15 days if it's not what you expected.",
  },
  {
    q: "Can I cancel or modify an order after placing it?",
    a: "Orders can be modified or cancelled within 1 hour of placement, before they enter dispatch. Contact us on WhatsApp or email hello@ayli.in with your order number.",
  },
  {
    q: "Do you ship pan-India?",
    a: "Yes — we deliver to all pincodes served by our logistics partners across India. Remote areas may take an additional 1–2 business days.",
  },
  {
    q: "How do I contact customer support?",
    a: "WhatsApp is the fastest way — we typically reply within minutes during business hours (10am–7pm IST). You can also email hello@ayli.in and expect a response within 24 hours.",
  },
];

export default function FAQPage() {
  return (
    <div className="pb-16 pt-5">
      <PageContainer className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-muted">
          Everything you need to know about shopping at AYLI. Can&apos;t find your answer?{' '}
          <a href="/contact" className="font-medium text-ayli-blue hover:underline">
            Get in touch
          </a>
          .
        </p>

        <div className="mt-10 flex flex-col gap-6">
          {FAQS.map((faq) => (
            <section key={faq.q} className="rounded-card border border-hairline bg-warm-white p-5">
              <h2 className="font-display text-base font-semibold text-ink">{faq.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{faq.a}</p>
            </section>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}