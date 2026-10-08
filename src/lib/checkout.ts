// Shared checkout contracts — safe to import from both server actions and
// client components (values here are never exported from "use server" files).

export const EXPRESS_SHIPPING_FEE = 99;
export const COD_FEE = 49;

export type ShippingMethod = "standard" | "express";
export type PaymentMethodChoice = "upi" | "card" | "cod";

export interface CheckoutAddress {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderActionResult {
  ok: boolean;
  message?: string;
  orderId?: string;
  orderNumber?: string;
  payment?: { id: string; amount: number; currency: string };
  gateway?: string;
  publicKey?: string | null;
  /** PhonePe only: the hosted payment page URL to redirect the customer to. */
  redirectUrl?: string;
  fieldErrors?: Record<string, string>;
  address?: CheckoutAddress;
}