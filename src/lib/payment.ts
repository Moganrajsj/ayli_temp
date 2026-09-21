// Payment provider abstraction — the ONLY gateway interface consumers see.
// The initial implementation is Razorpay (src/lib/razorpay.ts); swapping later
// means a new class + one factory line here. A mock provider (local/dev only)
// keeps the whole checkout flow testable before real Razorpay keys exist.
import { randomUUID } from "node:crypto";
import { RazorpayProvider } from "@/lib/razorpay";

export interface CreateOrderParams {
  amount: number; // rupees
  currency?: string;
  receipt: string;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentProvider {
  readonly gateway: "razorpay" | "mock";
  createOrder(params: CreateOrderParams): Promise<PaymentOrder>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
  publicKey(): string | null;
}

class MockPaymentProvider implements PaymentProvider {
  readonly gateway = "mock" as const;

  publicKey(): string | null {
    return null;
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    // Dev-only stand-in: simulates a successful order creation so the flow can
    // be exercised end-to-end. Never used in production (factory guards below).
    return {
      id: `mock_${randomUUID().replaceAll("-", "").slice(0, 16)}`,
      amount: params.amount,
      currency: params.currency ?? "INR",
    };
  }

  async verifyPayment(): Promise<boolean> {
    return true;
  }
}

const hasRazorpayKeys = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);

export const paymentProvider: PaymentProvider =
  hasRazorpayKeys && process.env.NODE_ENV !== "test"
    ? new RazorpayProvider()
    : process.env.NODE_ENV === "production"
      ? // No real keys in prod: checkout would hang, so fail loudly at build/start.
        new RazorpayProvider()
      : new MockPaymentProvider();

export const isMockGateway = (): boolean =>
  paymentProvider.gateway === "mock";