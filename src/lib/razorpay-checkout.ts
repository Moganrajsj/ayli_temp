// Client-side Razorpay checkout bootstrap. Injects the official checkout
// script exactly once and resolves with the constructor. Types mirror the
// documented Razorpay + handler payload shape.

export interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayCheckoutResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayCheckoutInstance {
  open(): void;
}

export interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayCheckoutInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptPromise: Promise<RazorpayConstructor> | null = null;

export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser."));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!scriptPromise) {
    scriptPromise = new Promise<RazorpayConstructor>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-ayli-razorpay]'
      );
      if (existing) {
        existing.addEventListener("load", () =>
          window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay did not initialise.")),
        );
        existing.addEventListener("error", () =>
          reject(new Error("Could not load Razorpay checkout."))
        );
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.ayliRazorpay = "yes";
      script.onload = () =>
        window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay did not initialise."));
      script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}