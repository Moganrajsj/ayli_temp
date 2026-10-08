// Payment provider abstraction — the ONLY gateway interface consumers see.
// PhonePe is the active production gateway (redirect-flow / PAY_PAGE).
// Razorpay implementation is retained but no longer wired into the factory.
// A MockPaymentProvider keeps the full checkout flow testable without real keys.
import { randomUUID } from "node:crypto";
import { PhonePeProvider } from "@/lib/phonepe";

export interface CreateOrderParams {
  amount: number; // rupees
  currency?: string;
  receipt: string;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  /** PhonePe only: URL of the hosted payment page the customer should be sent to. */
  redirectUrl?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentProvider {
  readonly gateway: "razorpay" | "phonepe" | "mock";
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

const hasPhonePeKeys = Boolean(
  process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY
);

export const paymentProvider: PaymentProvider =
  hasPhonePeKeys && process.env.NODE_ENV !== "test"
    ? new PhonePeProvider()
    : process.env.NODE_ENV === "production"
      ? // No real keys in prod: fail loudly so the misconfiguration is obvious.
        new PhonePeProvider()
      : new MockPaymentProvider();

export const isMockGateway = (): boolean =>
  paymentProvider.gateway === "mock";