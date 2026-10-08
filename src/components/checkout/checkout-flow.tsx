"use client";

import { useRef, useState, useTransition } from "react";
import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatINR } from "@/lib/utils";
import type { CartLine, CartTotals } from "@/lib/cart";
import {
  type CheckoutAddress,
  type OrderActionResult,
  type PaymentMethodChoice,
  EXPRESS_SHIPPING_FEE,
  COD_FEE,
} from "@/lib/checkout";
import {
  cancelOrder,
  createCheckoutAddress,
  placeOrder,
  verifyAndConfirmOrder,
} from "@/actions/order.action";
import { dispatchCartUpdated } from "@/components/cart/cart-badge";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { OrderButton } from "@/components/checkout/order-button";
import { Icon } from "@/components/ui/icons";
import { Input } from "@/components/ui/field";

export interface CheckoutFlowProps {
  addresses: CheckoutAddress[];
  lines: CartLine[];
  totals: CartTotals;
  /** Pre-populated error message, e.g. from a failed PhonePe redirect. */
  initialError?: string;
}

type Step = 1 | 2 | 3;

const STEPS: Array<{ n: Step; label: string }> = [
  { n: 1, label: "Address" },
  { n: 2, label: "Delivery" },
  { n: 3, label: "Payment" },
];

const EXPRESS_SHIPPING_LABEL = "Express (2–3 business days)";
const STANDARD_SHIPPING_LABEL = "Standard (4–6 business days)";

export function CheckoutFlow({ addresses, lines, totals, initialError }: CheckoutFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  const [step, setStep] = useState<Step>(1);

  const goToStep = (n: Step) => startTransition(() => setStep(n));
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses[0]?.id ?? null
  );
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard"
  );
  const [paymentChoice, setPaymentChoice] = useState<PaymentMethodChoice>("upi");
  const [showAddressForm, setShowAddressForm] = useState(addresses.length === 0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const [knownAddresses, setKnownAddresses] =
    useState<CheckoutAddress[]>(addresses);

  const codFee = paymentChoice === "cod" ? COD_FEE : 0;
  const standardShipping = totals.shippingFree ? 0 : totals.shipping;
  const expressShipping = standardShipping + EXPRESS_SHIPPING_FEE;
  const activeShipping =
    shippingMethod === "express" ? expressShipping : standardShipping;
  const grandTotal = totals.grandTotal + (shippingMethod === "express" ? EXPRESS_SHIPPING_FEE : 0) + codFee;

  const selectedAddress =
    knownAddresses.find((a) => a.id === selectedAddressId) ?? null;

  const addAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setFieldErrors({});
    setError(null);
    try {
      const result: OrderActionResult = await createCheckoutAddress(
        new FormData(form)
      );

      if (!result.ok || !result.address) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.message ?? "Could not save this address.");
        return;
      }
      setKnownAddresses((list) => [...list, result.address!]);
      setSelectedAddressId(result.address!.id);
      setShowAddressForm(false);
      form.reset();
      toast("Address saved.", "success");
    } catch (err) {
      console.error("Add address error:", err);
      setError("An unexpected error occurred while saving the address. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmAddress = () => {
    if (!selectedAddress) {
      setError("Please choose a delivery address.");
      return;
    }
    setError(null);
    goToStep(2);
  };

  const confirmDelivery = () => {
    setError(null);
    goToStep(3);
  };

  const beginPayment = async () => {
    if (!selectedAddress || !lines.length) {
      setError(lines.length ? "Please choose a delivery address." : "Your bag is empty.");
      return false;
    }
    setBusy(true);
    setError(null);
    const result = await placeOrder(selectedAddress.id, shippingMethod, paymentChoice);
    setBusy(false);

    if (!result.ok) {
      setError(result.message ?? "Could not start payment. Please try again.");
      return false;
    }

    const { orderId, orderNumber } = result;

    // ── Cash on Delivery (COD) ──────────────────────────────────────────────
    if (result.gateway === "cod") {
      dispatchCartUpdated();
      toast("Order placed successfully with Cash on Delivery!", "success");
      await new Promise((r) => setTimeout(r, 2600));
      router.push(`/order/${result.orderNumber ?? orderNumber ?? ""}`);
      return true;
    }

    // ── Mock gateway (dev-only) ─────────────────────────────────────────────
    if (result.gateway === "mock") {
      if (!orderId) {
        setError("Order initialization failed.");
        return false;
      }
      const mockResult = await verifyAndConfirmOrder({
        orderId,
        paymentId: `mock_pay_${Date.now().toString(36)}`,
        signature: "mock-signature",
      });
      if (mockResult.ok) {
        dispatchCartUpdated();
        await new Promise((r) => setTimeout(r, 2600));
        router.push(`/order/${mockResult.orderNumber ?? orderNumber ?? ""}`);
        return true;
      } else {
        setError(mockResult.message ?? "Mock payment failed.");
        return false;
      }
    }

    if (!orderId) {
      setError("Order initialization failed. Please try again.");
      return false;
    }

    // ── PhonePe — redirect to hosted payment page ───────────────────────────
    if (result.gateway === "phonepe") {
      if (!result.redirectUrl) {
        await cancelOrder(orderId);
        setError("Could not retrieve payment URL. Please try again.");
        return false;
      }
      // Navigate away — PhonePe will redirect back to /checkout/callback?txnId=...
      window.location.href = result.redirectUrl;
      return true;
    }

    // ── Razorpay (legacy fallback) ──────────────────────────────────────────
    if (result.gateway === "razorpay" && (!result.publicKey || !result.payment)) {
      await cancelOrder(orderId);
      setError("Razorpay is not configured. Payment could not start.");
      return false;
    }

    // Dynamically load Razorpay only when actually needed.
    const { loadRazorpay } = await import("@/lib/razorpay-checkout");
    let Razorpay;
    try {
      Razorpay = await loadRazorpay();
    } catch {
      await cancelOrder(orderId);
      setError("Could not load the payment window. Please try again.");
      return false;
    }

    const payment = result.payment!;
    new Razorpay({
      key: result.publicKey!,
      amount: Math.round(payment.amount * 100),
      currency: payment.currency,
      name: "AYLI",
      description: `Order ${orderNumber ?? ""}`,
      order_id: payment.id,
      prefill: {
        name: selectedAddress.name,
        contact: selectedAddress.phone,
      },
      theme: { color: "#22C0D4" },
      notes: { orderId, orderNumber: orderNumber ?? "" },
      modal: {
        ondismiss: () => {
          void cancelOrder(orderId).then((res) => {
            toast(res.message ?? "Order cancelled.", "info");
            dispatchCartUpdated();
          });
        },
      },
      handler: (response) => {
        void verifyAndConfirmOrder({
          orderId,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }).then((res) => {
          if (!res.ok) {
            toast(res.message ?? "Payment could not be confirmed.", "error");
            setError(res.message ?? "Payment could not be confirmed.");
            return;
          }
          dispatchCartUpdated();
          router.push(`/order/${res.orderNumber ?? orderNumber}`);
        });
      },
    }).open();
    return true;
  };

  const stepDone = (n: Step) =>
    n < step ||
    (n === step &&
      (n === 1 ? Boolean(selectedAddress) : n === 2 ? Boolean(lines.length) : true));

  return (
    <div className="pb-28 lg:pb-10">
      {/* progress */}
      <ol className="mb-8 flex items-center gap-2" aria-label="Checkout progress">
        {STEPS.map((s, i) => (
          <li key={s.n} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => s.n < step && goToStep(s.n)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-all duration-300 ease-out-soft",
                s.n === step
                  ? "bg-ayli-blue text-white shadow-soft scale-105"
                  : stepDone(s.n)
                    ? "bg-ayli-blue/10 text-ayli-blue"
                    : "bg-soft-beige text-muted"
              )}
            >
              <span className={cn(
                "inline-grid h-4 w-4 place-items-center rounded-full text-[10px] leading-none",
                stepDone(s.n) && s.n < step && "bg-ayli-blue text-white"
              )}>
                {stepDone(s.n) && s.n < step ? (
                  <Icon name="check" className="h-2.5 w-2.5" />
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px w-4 bg-hairline transition-colors duration-500",
                  s.n < step && "bg-ayli-blue/50"
                )}
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        {/* left column steps */}
        <div className="min-w-0">
          <ViewTransition
            key={`checkout-step-${step}`}
            name="checkout-step"
            share="auto"
            enter="auto"
            default="none"
          >
          {step === 1 ? (
            <section aria-label="Delivery address">
              <h2 className="mb-4 font-display text-xl font-semibold tracking-tight text-ink">
                Where should we deliver?
              </h2>

              {knownAddresses.length > 0 ? (
                <ul className="grid gap-3">
                  {knownAddresses.map((address) => {
                    const active = selectedAddressId === address.id;
                    return (
                      <li key={address.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedAddressId(address.id)}
                          aria-pressed={active}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-card border bg-warm-white p-4 text-left transition-colors",
                            active
                              ? "border-ayli-blue ring-1 ring-ayli-blue"
                              : "border-hairline hover:border-ink/20"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                              active
                                ? "border-ayli-blue bg-ayli-blue text-white"
                                : "border-hairline"
                            )}
                          >
                            {active ? <Icon name="check" className="h-3 w-3" /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-ink">{address.name}</span>
                              <span className="text-sm text-muted">+91 {address.phone}</span>
                              {address.isDefault ? (
                                <span className="rounded-pill bg-ayli-peach/15 px-2 py-0.5 text-[10px] font-semibold text-[#B85C38]">
                                  Default
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-1 block text-sm leading-relaxed text-muted">
                              {address.line1}
                              {address.line2 ? `, ${address.line2}` : ""},{" "}
                              {address.city}, {address.state} — {address.pincode}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {showAddressForm ? (
                <form
                  ref={formRef}
                  onSubmit={addAddress}
                  className="mt-4 flex flex-col gap-4 rounded-card border border-hairline bg-warm-white p-5"
                >
                  <p className="font-display text-base font-medium text-ink">Add a new address</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Full name" type="text" name="name" autoComplete="name" required error={fieldErrors.name} />
                    <Input label="Phone" type="tel" name="phone" inputMode="numeric" maxLength={15} autoComplete="tel" placeholder="10-digit mobile number" required error={fieldErrors.phone} />
                  </div>
                  <Input label="Address line 1" type="text" name="line1" autoComplete="address-line1" placeholder="House no., building, street" required error={fieldErrors.line1} />
                  <Input label="Address line 2 (optional)" type="text" name="line2" autoComplete="address-line2" placeholder="Area, landmark" error={fieldErrors.line2} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="City" type="text" name="city" autoComplete="address-level2" required error={fieldErrors.city} />
                    <Input label="State" type="text" name="state" autoComplete="address-level1" required error={fieldErrors.state} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Pincode" type="text" name="pincode" inputMode="numeric" maxLength={8} autoComplete="postal-code" placeholder="6-digit pincode" required error={fieldErrors.pincode} />
                    <Input label="Country" type="text" name="country" defaultValue="India" required error={fieldErrors.country} />
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      name="isDefault"
                      value="true"
                      className="h-4 w-4 rounded border-hairline accent-[#22C0D4]"
                    />
                    <span>Make this my default delivery address</span>
                  </label>
                  {error ? (
                    <p className="text-sm font-medium text-danger" role="alert">{error}</p>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <Button type="submit" isLoading={busy} fullWidth>
                      Save address
                    </Button>
                    {knownAddresses.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setError(null);
                        }}
                        className="shrink-0 px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-soft-beige rounded-pill"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(true);
                    setError(null);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-[15px] font-medium text-ayli-blue transition-colors hover:bg-soft-beige"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add a new address
                </button>
              )}
            </section>
          ) : null}

          {step === 2 ? (
            <section aria-label="Delivery method">
              <h2 className="mb-4 font-display text-xl font-semibold tracking-tight text-ink">
                Choose delivery
              </h2>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setShippingMethod("standard")}
                  aria-pressed={shippingMethod === "standard"}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-card border bg-warm-white p-4 text-left transition-colors",
                    shippingMethod === "standard"
                      ? "border-ayli-blue ring-1 ring-ayli-blue"
                      : "border-hairline hover:border-ink/20"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon name="truck" className="h-5 w-5 text-ayli-blue" />
                    <span>
                      <span className="block font-medium text-ink">{STANDARD_SHIPPING_LABEL}</span>
                      <span className="block text-sm text-muted">Free delivery · 15-day easy returns</span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {standardShipping === 0 ? "Free" : formatINR(standardShipping)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingMethod("express")}
                  aria-pressed={shippingMethod === "express"}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-card border bg-warm-white p-4 text-left transition-colors",
                    shippingMethod === "express"
                      ? "border-ayli-blue ring-1 ring-ayli-blue"
                      : "border-hairline hover:border-ink/20"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon name="sparkles" className="h-5 w-5 text-ayli-peach" />
                    <span>
                      <span className="block font-medium text-ink">{EXPRESS_SHIPPING_LABEL}</span>
                      <span className="block text-sm text-muted">Priority dispatch · 2–3 business days</span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {formatINR(expressShipping)}
                  </span>
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section aria-label="Review and pay">
              {/* Payment Methods */}
              <div className="mb-6">
                <h2 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink">
                  Select payment method
                </h2>
                <p className="mb-4 text-xs text-muted">
                  Choose how you would like to pay for your order.
                </p>

                <div className="grid gap-3">
                  {/* UPI */}
                  <button
                    type="button"
                    onClick={() => setPaymentChoice("upi")}
                    aria-pressed={paymentChoice === "upi"}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-card border bg-warm-white p-4 text-left transition-all",
                      paymentChoice === "upi"
                        ? "border-ayli-blue ring-1 ring-ayli-blue shadow-soft"
                        : "border-hairline hover:border-ink/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                          paymentChoice === "upi"
                            ? "border-ayli-blue bg-ayli-blue text-white"
                            : "border-hairline"
                        )}
                      >
                        {paymentChoice === "upi" ? <Icon name="check" className="h-3 w-3" /> : null}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">UPI (GPay, PhonePe, Paytm, QR)</span>
                          <span className="rounded-pill bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-[#2e9e6d]">
                            Instant & Free
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          Fastest checkout via any UPI app or instant QR code. Zero transaction fees.
                        </p>
                      </div>
                    </div>
                    <Icon name="qr-code" className="h-5 w-5 shrink-0 text-ayli-blue" />
                  </button>

                  {/* Cards & NetBanking */}
                  <button
                    type="button"
                    onClick={() => setPaymentChoice("card")}
                    aria-pressed={paymentChoice === "card"}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-card border bg-warm-white p-4 text-left transition-all",
                      paymentChoice === "card"
                        ? "border-ayli-blue ring-1 ring-ayli-blue shadow-soft"
                        : "border-hairline hover:border-ink/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                          paymentChoice === "card"
                            ? "border-ayli-blue bg-ayli-blue text-white"
                            : "border-hairline"
                        )}
                      >
                        {paymentChoice === "card" ? <Icon name="check" className="h-3 w-3" /> : null}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">Credit / Debit Card / Net Banking</span>
                          <span className="rounded-pill bg-ayli-blue/10 px-2 py-0.5 text-[10px] font-semibold text-ayli-blue">
                            All Cards Accepted
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          Visa, MasterCard, RuPay, Maestro and Net Banking from all major Indian banks.
                        </p>
                      </div>
                    </div>
                    <Icon name="credit-card" className="h-5 w-5 shrink-0 text-ayli-blue" />
                  </button>

                  {/* Cash on Delivery (COD) */}
                  <button
                    type="button"
                    onClick={() => setPaymentChoice("cod")}
                    aria-pressed={paymentChoice === "cod"}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-card border bg-warm-white p-4 text-left transition-all",
                      paymentChoice === "cod"
                        ? "border-ayli-blue ring-1 ring-ayli-blue shadow-soft"
                        : "border-hairline hover:border-ink/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                          paymentChoice === "cod"
                            ? "border-ayli-blue bg-ayli-blue text-white"
                            : "border-hairline"
                        )}
                      >
                        {paymentChoice === "cod" ? <Icon name="check" className="h-3 w-3" /> : null}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">Cash on Delivery (COD)</span>
                          <span className="rounded-pill bg-[#B85C38]/15 px-2 py-0.5 text-[10px] font-semibold text-[#B85C38]">
                            +{formatINR(COD_FEE)} handling fee
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          Pay with cash or UPI at your doorstep upon package arrival.
                        </p>
                      </div>
                    </div>
                    <Icon name="banknotes" className="h-5 w-5 shrink-0 text-[#B85C38]" />
                  </button>
                </div>

                {paymentChoice === "cod" ? (
                  <div className="mt-3 flex items-start gap-2.5 rounded-card border border-[#B85C38]/20 bg-[#B85C38]/5 p-3 text-xs text-[#8A3B14]">
                    <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-[#B85C38]" />
                    <p>
                      <strong>Cash on Delivery:</strong> A flat ₹{COD_FEE} handling fee is applied for courier cash verification and processing. Total payable on delivery: <strong>{formatINR(grandTotal)}</strong>.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Order Review */}
              <div className="mb-4">
                <h3 className="mb-3 font-display text-lg font-semibold tracking-tight text-ink">
                  Items in your order
                </h3>

                <ul className="divide-y divide-hairline/70 rounded-card border border-hairline bg-warm-white px-4">
                  {lines.map((line) => (
                    <li key={line.id ?? line.variantId} className="flex items-center gap-4 py-4">
                      <span className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-card bg-soft-beige">
                        {line.image ? (
                          <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center">
                            <Icon name="sparkles" className="h-4 w-4 text-ayli-blue/40" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{line.name}</span>
                        <span className="block text-xs text-muted">
                          {line.colour} · {line.size} · Qty {line.quantity}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-ink">
                        {formatINR(line.lineSelling)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Delivery Address Summary */}
              <div className="flex items-start justify-between gap-3 rounded-card border border-hairline bg-warm-white p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">Delivering to: {selectedAddress?.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    {selectedAddress?.line1}
                    {selectedAddress?.line2 ? `, ${selectedAddress.line2}` : ""},{" "}
                    {selectedAddress?.city}, {selectedAddress?.state} — {selectedAddress?.pincode}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {shippingMethod === "express" ? EXPRESS_SHIPPING_LABEL : STANDARD_SHIPPING_LABEL}
                  </p>
                </div>
                <Link
                  href="#"
                  onClick={(e) => { e.preventDefault(); goToStep(1); }}
                  className="shrink-0 text-sm font-medium text-ayli-blue hover:text-[#1496a8]"
                >
                  Edit
                </Link>
              </div>
            </section>
          ) : null}
          </ViewTransition>

          {error ? (
            <p className="mt-4 rounded-card bg-danger/10 px-4 py-2.5 text-sm font-medium text-[#D95C5C]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {/* summary column */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-card border border-hairline bg-warm-white p-5">
            <p className="font-display text-lg font-medium text-ink">Order summary</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">MRP</dt>
                <dd className="text-ink">{formatINR(totals.mrpTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd className="font-medium text-[#2e9e6d]">−{formatINR(totals.savings)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping ({shippingMethod})</dt>
                <dd className="text-ink">
                  {activeShipping === 0 ? "Free" : formatINR(activeShipping)}
                </dd>
              </div>
              {codFee > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted">COD fee</dt>
                  <dd className="font-medium text-[#B85C38]">+{formatINR(codFee)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-hairline/70 pt-3 text-base">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-display font-semibold text-ayli-blue">
                  {formatINR(grandTotal)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 flex items-center gap-2 rounded-card bg-soft-beige px-3 py-2.5 text-xs text-muted">
              <Icon name="shield" className="h-4 w-4 shrink-0 text-ayli-blue" />
              Prices are inclusive of all taxes. No hidden charges.
            </p>
          </div>

          <p className="flex items-center gap-2 rounded-card bg-soft-beige px-4 py-3 text-xs text-muted">
            <Icon name="truck" className="h-4 w-4 shrink-0 text-ayli-blue" />
            Dispatch within 24 hours · 15-day easy returns
          </p>
        </aside>
      </div>

      {/* sticky CTA (mobile) */}
      <div className="fixed inset-x-0 bottom-20 z-30 border-t border-hairline bg-warm-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Total</p>
            <p className="text-base font-semibold text-ink">{formatINR(grandTotal)}</p>
          </div>
          {step === 3 ? (
            <div className="flex-1 max-w-[240px]">
              <OrderButton
                onClick={beginPayment}
                isSubmitting={busy}
                defaultText={
                  paymentChoice === "cod"
                    ? `Place Order`
                    : `Pay ${formatINR(grandTotal)}`
                }
                successText="Order Placed"
              />
            </div>
          ) : (
            <Button
              onClick={step === 1 ? confirmAddress : confirmDelivery}
              isLoading={busy}
              size="lg"
              className="flex-1 justify-center"
            >
              Continue
              <Icon name="arrow-right" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* desktop CTA */}
      <div className="mt-8 hidden lg:block">
        {step === 3 ? (
          <OrderButton
            onClick={beginPayment}
            isSubmitting={busy}
            fullWidth
            defaultText={
              paymentChoice === "cod"
                ? `Place Order (Cash on Delivery) — ${formatINR(grandTotal)}`
                : `Pay ${formatINR(grandTotal)} securely`
            }
            successText="Order Placed"
          />
        ) : (
          <Button
            onClick={step === 1 ? confirmAddress : confirmDelivery}
            isLoading={busy}
            size="lg"
            fullWidth
          >
            {step === 1 ? "Continue to delivery" : "Continue to payment"}
            <Icon name="arrow-right" className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}