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
  EXPRESS_SHIPPING_FEE,
} from "@/lib/checkout";
import {
  cancelOrder,
  createCheckoutAddress,
  placeOrder,
  verifyAndConfirmOrder,
} from "@/actions/order.action";
import { dispatchCartUpdated } from "@/components/cart/cart-badge";
import {
  loadRazorpay,
  type RazorpayCheckoutResponse,
} from "@/lib/razorpay-checkout";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Input } from "@/components/ui/field";

export interface CheckoutFlowProps {
  addresses: CheckoutAddress[];
  lines: CartLine[];
  totals: CartTotals;
}

type Step = 1 | 2 | 3;

const STEPS: Array<{ n: Step; label: string }> = [
  { n: 1, label: "Address" },
  { n: 2, label: "Delivery" },
  { n: 3, label: "Payment" },
];

const EXPRESS_SHIPPING_LABEL = "Express (2–3 business days)";
const STANDARD_SHIPPING_LABEL = "Standard (4–6 business days)";

export function CheckoutFlow({ addresses, lines, totals }: CheckoutFlowProps) {
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
  const [showAddressForm, setShowAddressForm] = useState(addresses.length === 0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [knownAddresses, setKnownAddresses] =
    useState<CheckoutAddress[]>(addresses);

  const standardShipping = totals.shippingFree ? 0 : totals.shipping;
  const expressShipping = standardShipping + EXPRESS_SHIPPING_FEE;
  const activeShipping =
    shippingMethod === "express" ? expressShipping : standardShipping;
  const grandTotal = totals.grandTotal + (shippingMethod === "express" ? EXPRESS_SHIPPING_FEE : 0);

  const selectedAddress =
    knownAddresses.find((a) => a.id === selectedAddressId) ?? null;

  const addAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setFieldErrors({});
    setError(null);
    const result: OrderActionResult = await createCheckoutAddress(
      new FormData(form)
    );
    setBusy(false);

    if (!result.ok || !result.address) {
      setFieldErrors(result.fieldErrors ?? {});
      setError(result.message ?? "Could not save this address.");
      return;
    }
    setKnownAddresses((list) => [...list, result.address!]);
    setSelectedAddressId(result.address!.id);
    setShowAddressForm(false);
    toast("Address saved.", "success");
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

  const handlePaymentSuccess = async (
    orderId: string,
    orderNumber: string,
    response: RazorpayCheckoutResponse
  ) => {
    const result = await verifyAndConfirmOrder({
      orderId,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature,
    });
    if (!result.ok) {
      toast(result.message ?? "Payment could not be confirmed.", "error");
      setError(result.message ?? "Payment could not be confirmed.");
      return;
    }
    dispatchCartUpdated();
    router.push(`/order/${result.orderNumber ?? orderNumber}`);
  };

  const beginPayment = async () => {
    if (!selectedAddress || !lines.length) {
      setError(lines.length ? "Please choose a delivery address." : "Your bag is empty.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await placeOrder(selectedAddress.id, shippingMethod);
    setBusy(false);

    if (!result.ok || !result.payment || !result.orderId) {
      setError(result.message ?? "Could not start payment. Please try again.");
      return;
    }

    const { orderId, orderNumber } = result;

    if (result.gateway === "mock") {
      await handlePaymentSuccess(orderId, orderNumber!, {
        razorpay_payment_id: `mock_pay_${Date.now().toString(36)}`,
        razorpay_order_id: result.payment.id,
        razorpay_signature: "mock-signature",
      });
      return;
    }

    if (result.gateway === "razorpay" && !result.publicKey) {
      await cancelOrder(orderId);
      setError("Razorpay is not configured. Payment could not start.");
      return;
    }

    let Razorpay;
    try {
      Razorpay = await loadRazorpay();
    } catch {
      await cancelOrder(orderId);
      setError("Could not load the payment window. Please try again.");
      return;
    }

    new Razorpay({
      key: result.publicKey!,
      amount: Math.round(result.payment.amount * 100),
      currency: result.payment.currency,
      name: "AYLI",
      description: `Order ${orderNumber}`,
      order_id: result.payment.id,
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
        void handlePaymentSuccess(orderId, orderNumber ?? "", response);
      },
    }).open();
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
                    <Input label="Phone" type="tel" name="phone" inputMode="numeric" maxLength={10} autoComplete="tel" placeholder="10-digit mobile number" required error={fieldErrors.phone} />
                  </div>
                  <Input label="Address line 1" type="text" name="line1" autoComplete="address-line1" placeholder="House no., building, street" required error={fieldErrors.line1} />
                  <Input label="Address line 2 (optional)" type="text" name="line2" autoComplete="address-line2" placeholder="Area, landmark" error={fieldErrors.line2} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="City" type="text" name="city" autoComplete="address-level2" required error={fieldErrors.city} />
                    <Input label="State" type="text" name="state" autoComplete="address-level1" required error={fieldErrors.state} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Pincode" type="text" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" required error={fieldErrors.pincode} />
                    <Input label="Country" type="text" name="country" defaultValue="India" required error={fieldErrors.country} />
                  </div>
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
              <h2 className="mb-4 font-display text-xl font-semibold tracking-tight text-ink">
                Review your order
              </h2>

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

              <div className="mt-4 flex items-start justify-between gap-3 rounded-card border border-hairline bg-warm-white p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{selectedAddress?.name}</p>
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
          <Button
            onClick={step === 1 ? confirmAddress : step === 2 ? confirmDelivery : beginPayment}
            isLoading={busy}
            size="lg"
            className="flex-1 justify-center"
          >
            {step === 1 ? "Continue" : step === 2 ? "Continue" : `Pay ${formatINR(grandTotal)}`}
            <Icon name="arrow-right" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* desktop CTA */}
      <div className="mt-8 hidden lg:block">
        <Button
          onClick={step === 1 ? confirmAddress : step === 2 ? confirmDelivery : beginPayment}
          isLoading={busy}
          size="lg"
          fullWidth
        >
          {step === 1 ? "Continue to delivery" : step === 2 ? "Continue to payment" : `Pay ${formatINR(grandTotal)} securely`}
          <Icon name="arrow-right" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}