import { createHmac } from "node:crypto";
import type {
  CreateOrderParams,
  PaymentOrder,
  PaymentProvider,
  VerifyPaymentParams,
} from "@/lib/payment";

const RazorpayKey = process.env.RAZORPAY_KEY_ID ?? "";
const RazorpaySecret = process.env.RAZORPAY_KEY_SECRET ?? "";

export class RazorpayProvider implements PaymentProvider {
  readonly gateway = "razorpay" as const;

  publicKey(): string | null {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || (RazorpayKey || null);
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    if (!RazorpayKey || !RazorpaySecret) {
      throw new Error("Razorpay credentials are not configured (RAZORPAY_KEY_ID/SECRET).");
    }

    const body = JSON.stringify({
      amount: Math.round(params.amount * 100), // rupees → paise
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      payment_capture: 1,
    });

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${RazorpayKey}:${RazorpaySecret}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Razorpay createOrder failed (${res.status}): ${text}`);
    }

    const data: {
      id?: string;
      amount?: number | string;
      currency?: string;
    } = await res.json();

    if (!data.id) {
      throw new Error("Razorpay createOrder returned no order id.");
    }

    const amountInRupees =
      typeof data.amount === "number" ? data.amount / 100 : Number(data.amount ?? 0) / 100;

    return {
      id: data.id,
      amount: amountInRupees,
      currency: data.currency ?? "INR",
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (!RazorpaySecret) return false;
    const expected = createHmac("sha256", RazorpaySecret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest("hex");
    return expected === params.signature;
  }

  async refundPayment(paymentId: string, amountInRupees?: number): Promise<{ id: string; amount: number; status: string }> {
    if (!RazorpayKey || !RazorpaySecret) {
      throw new Error("Razorpay credentials are not configured.");
    }

    const payload: Record<string, unknown> = {};
    if (amountInRupees && amountInRupees > 0) {
      payload.amount = Math.round(amountInRupees * 100);
    }

    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${RazorpayKey}:${RazorpaySecret}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Razorpay refund failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { id: string; amount: number; status: string };
    return {
      id: data.id,
      amount: data.amount ? data.amount / 100 : (amountInRupees ?? 0),
      status: data.status ?? "processed",
    };
  }
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}