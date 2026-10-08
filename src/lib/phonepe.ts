// PhonePe Payment Gateway provider — uses the hosted PAY_PAGE redirect flow.
// Customers are sent to PhonePe's payment page and redirected back via
// /checkout/callback?txnId=... after the payment attempt completes.
//
// API reference: https://developer.phonepe.com/v1/reference
// X-VERIFY formula: SHA256(base64Payload + apiEndpoint + SALT_KEY) + "###" + SALT_INDEX

import { createHash } from "node:crypto";
import type {
  CreateOrderParams,
  PaymentOrder,
  PaymentProvider,
  VerifyPaymentParams,
} from "@/lib/payment";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID ?? "";
const SALT_KEY    = process.env.PHONEPE_SALT_KEY ?? "";
const SALT_INDEX  = process.env.PHONEPE_SALT_INDEX ?? "1";
const HOST_URL    = process.env.PHONEPE_HOST_URL ?? "https://api.phonepe.com/apis/hermes";
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? "https://ayli.in";

/** Generate the X-VERIFY checksum for a given base64 payload + API endpoint. */
function xVerify(base64Payload: string, endpoint: string): string {
  const hash = createHash("sha256")
    .update(base64Payload + endpoint + SALT_KEY)
    .digest("hex");
  return `${hash}###${SALT_INDEX}`;
}

/** Extended PaymentOrder including the PhonePe hosted page redirect URL. */
export interface PhonePePaymentOrder extends PaymentOrder {
  redirectUrl: string;
}

export class PhonePeProvider implements PaymentProvider {
  readonly gateway = "phonepe" as const;

  /** PhonePe uses a redirect flow — no client-side public key required. */
  publicKey(): string | null {
    return null;
  }

  /**
   * Initiates a PhonePe payment session.
   * Returns the order details plus the hosted payment page URL to redirect to.
   */
  async createOrder(
    params: CreateOrderParams
  ): Promise<PhonePePaymentOrder> {
    if (!MERCHANT_ID || !SALT_KEY) {
      throw new Error(
        "PhonePe credentials are not configured (PHONEPE_MERCHANT_ID / PHONEPE_SALT_KEY)."
      );
    }

    // merchantTransactionId must be unique and <= 38 chars; orderNumber fits perfectly.
    const merchantTransactionId = params.receipt;
    const amountInPaise = Math.round(params.amount * 100);

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: merchantTransactionId.slice(0, 36),
      amount: amountInPaise,
      currency: params.currency ?? "INR",
      redirectUrl: `${APP_URL}/checkout/callback?txnId=${encodeURIComponent(merchantTransactionId)}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${APP_URL}/api/webhooks/phonepe`,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = xVerify(base64Payload, "/pg/v1/pay");

    const res = await fetch(`${HOST_URL}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PhonePe createOrder failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      success?: boolean;
      data?: { instrumentResponse?: { redirectInfo?: { url?: string } } };
    };

    const redirectUrl = data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      throw new Error(
        "PhonePe did not return a redirect URL. Response: " + JSON.stringify(data)
      );
    }

    return {
      id: merchantTransactionId, // used as paymentOrderId in the Order row
      amount: params.amount,
      currency: params.currency ?? "INR",
      redirectUrl,
    };
  }

  /**
   * Verifies payment status by calling PhonePe's Transaction Status API.
   * params.orderId = merchantTransactionId (= orderNumber).
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (!MERCHANT_ID || !SALT_KEY) return false;

    const endpoint = `/pg/v1/status/${MERCHANT_ID}/${params.orderId}`;
    const hash = createHash("sha256")
      .update(endpoint + SALT_KEY)
      .digest("hex");
    const checksum = `${hash}###${SALT_INDEX}`;

    const res = await fetch(`${HOST_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": MERCHANT_ID,
      },
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { code?: string };
    return data?.code === "PAYMENT_SUCCESS";
  }

  /**
   * Initiates a refund via PhonePe's Refund API.
   * @param merchantTransactionId  The original order's txnId (= orderNumber)
   * @param originalTransactionId  PhonePe's own transaction ID stored in paymentId
   * @param amountInRupees         Amount to refund in rupees
   */
  async refundPayment(
    merchantTransactionId: string,
    originalTransactionId: string,
    amountInRupees: number
  ): Promise<{ id: string; amount: number; status: string }> {
    if (!MERCHANT_ID || !SALT_KEY) {
      throw new Error("PhonePe credentials are not configured.");
    }

    const refundTxnId = `REF-${merchantTransactionId}-${Date.now()}`;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantUserId: merchantTransactionId,
      originalTransactionId,
      merchantTransactionId: refundTxnId,
      amount: Math.round(amountInRupees * 100),
      callbackUrl: `${APP_URL}/api/webhooks/phonepe`,
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = xVerify(base64Payload, "/pg/v1/refund");

    const res = await fetch(`${HOST_URL}/pg/v1/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PhonePe refund failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { code?: string; message?: string };
    return {
      id: refundTxnId,
      amount: amountInRupees,
      status: data?.code ?? "INITIATED",
    };
  }
}

/**
 * Verifies a PhonePe S2S webhook callback's X-VERIFY header.
 * The header is SHA256(base64ResponsePayload + SALT_KEY) + "###" + SALT_INDEX.
 */
export function verifyPhonePeWebhookSignature(
  base64Payload: string,
  receivedChecksum: string
): boolean {
  if (!SALT_KEY || !receivedChecksum) return false;
  const hash = createHash("sha256")
    .update(base64Payload + SALT_KEY)
    .digest("hex");
  const expected = `${hash}###${SALT_INDEX}`;
  return expected === receivedChecksum;
}
