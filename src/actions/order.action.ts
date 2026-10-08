"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { paymentProvider } from "@/lib/payment";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, getServerCart } from "@/lib/cart";
import { addressSchema, formatFieldErrors } from "@/lib/validation";
import {
  type OrderActionResult,
  type ShippingMethod,
  type PaymentMethodChoice,
  EXPRESS_SHIPPING_FEE,
  COD_FEE,
} from "@/lib/checkout";

async function requireUser(): Promise<{ id: string } | null> {
  const session = await auth();
  return session?.user?.id ? { id: session.user.id } : null;
}

function nextOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  const rand = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `AYLI-${ymd}-${rand}`;
}

function computedShipping(method: ShippingMethod, sellingTotal: number): number {
  const standard =
    sellingTotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  return standard + (method === "express" ? EXPRESS_SHIPPING_FEE : 0);
}

async function lockVariant(tx: Prisma.TransactionClient, variantId: string) {
  await tx.$queryRaw`SELECT id FROM Inventory WHERE variantId = ${variantId} FOR UPDATE`;
}

// Read available (unreserved) stock inside a locked transaction for a variant.
async function availableInTx(
  tx: Prisma.TransactionClient,
  variantId: string,
): Promise<number> {
  const inv = await tx.inventory.findUnique({
    where: { variantId },
    select: { stockQuantity: true, reservedQuantity: true },
  });
  return Math.max(0, (inv?.stockQuantity ?? 0) - (inv?.reservedQuantity ?? 0));
}

/* ───────── inline address creation (no redirect) ───────── */

export async function createCheckoutAddress(
  formData: FormData,
): Promise<OrderActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };

  const parsed = addressSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    country: formData.get("country"),
    isDefault: formData.get("isDefault"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: formatFieldErrors(parsed.error.issues),
    };
  }

  const { isDefault, ...data } = parsed.data;

  try {
    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: user.id } });
      if (isDefault || count === 0) {
        await tx.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: { ...data, userId: user.id, isDefault: isDefault || count === 0 },
      });
    });

    return {
      ok: true,
      address: {
        id: address.id,
        name: address.name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        isDefault: address.isDefault,
      },
    };
  } catch (error) {
    console.error("Failed to save delivery address:", error);
    return {
      ok: false,
      message: "Could not save address. Please try again.",
    };
  }
}

/* ───────── place order ───────── */

export async function placeOrder(
  addressId: string,
  method: ShippingMethod,
  paymentChoice: PaymentMethodChoice = "upi",
): Promise<OrderActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };

  if (method !== "standard" && method !== "express") {
    return { ok: false, message: "Invalid shipping method." };
  }

  if (paymentChoice !== "upi" && paymentChoice !== "card" && paymentChoice !== "cod") {
    return { ok: false, message: "Invalid payment method." };
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
    select: { id: true },
  });
  if (!address) return { ok: false, message: "Please choose a delivery address." };

  const { lines } = await getServerCart(user.id);

  const sellable = lines.filter((l) => l.availableNow && l.quantity > 0);
  if (sellable.length === 0) {
    return { ok: false, message: "Your bag is empty or only has out-of-stock items." };
  }

  const sellingTotal = sellable.reduce((sum, l) => sum + l.lineSelling, 0);
  const mrpTotal = sellable.reduce((sum, l) => sum + l.lineMrp, 0);
  const codFee = paymentChoice === "cod" ? COD_FEE : 0;
  const shipping = computedShipping(method, sellingTotal) + codFee;
  const total = sellingTotal + shipping;
  const orderNumber = nextOrderNumber();

  // ── Cash on Delivery (COD) flow ───────────────────────────────────────────
  if (paymentChoice === "cod") {
    try {
      const createdOrder = await prisma.$transaction(async (tx) => {
        for (const line of sellable) {
          await lockVariant(tx, line.variantId);
          const available = await availableInTx(tx, line.variantId);
          if (available < line.quantity) {
            throw new Error("OOS");
          }
        }

        const created = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            addressId,
            subtotal: sellingTotal,
            discount: Math.max(0, mrpTotal - sellingTotal),
            tax: 0,
            shipping,
            total,
            status: "CONFIRMED",
            paymentStatus: "PENDING",
            paymentMethod: "COD",
            shippingMethod: method === "express" ? "EXPRESS" : "STANDARD",
            items: {
              create: sellable.map((line) => ({
                productId: line.productId,
                variantId: line.variantId,
                name: line.name,
                image: line.image,
                colour: line.colour,
                size: line.size,
                quantity: line.quantity,
                price: line.unitSelling,
                total: line.lineSelling,
              })),
            },
          },
          select: { id: true, orderNumber: true },
        });

        // Deduct inventory directly for confirmed COD order
        for (const line of sellable) {
          await tx.inventory.update({
            where: { variantId: line.variantId },
            data: {
              stockQuantity: { decrement: line.quantity },
            },
          });
        }

        // Clear user cart
        const cart = await tx.cart.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        return created;
      });

      return {
        ok: true,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        gateway: "cod",
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "OOS") {
        return {
          ok: false,
          message: "One or more items in your cart went out of stock. Please review your bag.",
        };
      }
      console.error("COD order creation error:", err);
      return {
        ok: false,
        message: "Could not place COD order. Please try again.",
      };
    }
  }

  // ── Online payment flow (PhonePe / Mock) ───────────────────────────────────
  const gateway = paymentProvider.gateway;
  const paymentMethodLabel = paymentChoice === "card" ? "CARD" : "UPI";

  let order: { id: string };
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const line of sellable) {
        await lockVariant(tx, line.variantId);
        const available = await availableInTx(tx, line.variantId);
        if (available < line.quantity) {
          throw new Error("OOS");
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId,
          subtotal: sellingTotal,
          discount: Math.max(0, mrpTotal - sellingTotal),
          tax: 0,
          shipping,
          total,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: paymentMethodLabel,
          shippingMethod: method === "express" ? "EXPRESS" : "STANDARD",
          items: {
            create: sellable.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              name: line.name,
              image: line.image,
              colour: line.colour,
              size: line.size,
              quantity: line.quantity,
              price: line.unitSelling,
              total: line.lineSelling,
            })),
          },
        },
        select: { id: true },
      });

      for (const line of sellable) {
        await tx.inventory.update({
          where: { variantId: line.variantId },
          data: { reservedQuantity: { increment: line.quantity } },
        });
      }

      return { id: created.id };
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "OOS") {
      return {
        ok: false,
        message: "One or more items in your cart went out of stock. Please review your bag.",
      };
    }
    console.error("Order creation transaction error:", err);
    return {
      ok: false,
      message: "Could not create order. Please try again.",
    };
  }

  let payment;
  try {
    payment = await paymentProvider.createOrder({
      amount: total,
      currency: "INR",
      receipt: orderNumber,
    });
  } catch (err) {
    console.error("Payment initialization error:", err);
    await markOrderFailed(order.id);
    return {
      ok: false,
      message: "Payment could not be initialized. Please try again.",
    };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentOrderId: payment.id },
  });

  return {
    ok: true,
    orderId: order.id,
    orderNumber,
    payment,
    gateway,
    publicKey: paymentProvider.publicKey(),
    // PhonePe returns the hosted payment page URL inside the payment object.
    redirectUrl: (payment as { redirectUrl?: string }).redirectUrl,
  };
}

/* ───────── confirm payment ───────── */

/**
 * verifyAndConfirmOrder accepts two call shapes:
 *
 * 1. Razorpay / client-side (legacy): { orderId, paymentId, signature }
 *    Called directly from the checkout popup handler.
 *
 * 2. PhonePe / redirect callback: { txnId }
 *    Called from /checkout/callback?txnId=... after PhonePe redirects back.
 *    Looks up the order by paymentOrderId (= merchantTransactionId = orderNumber)
 *    and verifies via PhonePe's status API.
 */
export async function verifyAndConfirmOrder(
  input:
    | { orderId: string; paymentId: string; signature: string }
    | { txnId: string }
): Promise<OrderActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };

  // Resolve the order regardless of which call shape was used.
  let order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentOrderId: string | null;
    items: { variantId: string; quantity: number }[];
  } | null;

  if ("txnId" in input) {
    // PhonePe callback path: find order by merchantTransactionId.
    order = await prisma.order.findFirst({
      where: { paymentOrderId: input.txnId, userId: user.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentOrderId: true,
        items: { select: { variantId: true, quantity: true } },
      },
    });
  } else {
    order = await prisma.order.findFirst({
      where: { id: input.orderId, userId: user.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentOrderId: true,
        items: { select: { variantId: true, quantity: true } },
      },
    });
  }

  if (!order) return { ok: false, message: "Order not found." };

  if (order.status === "CONFIRMED") {
    return { ok: true, orderNumber: order.orderNumber };
  }

  if (order.status !== "PENDING") {
    return { ok: false, message: "This order is no longer pending." };
  }

  // Verify the payment with the gateway.
  let signatureValid = false;
  if ("txnId" in input) {
    // PhonePe: call status API using merchantTransactionId as orderId.
    signatureValid =
      order.paymentOrderId != null &&
      (await paymentProvider.verifyPayment({
        orderId: order.paymentOrderId,
        paymentId: "",   // not used by PhonePeProvider.verifyPayment
        signature: "",   // not used by PhonePeProvider.verifyPayment
      }));
  } else {
    signatureValid =
      order.paymentOrderId != null &&
      (await paymentProvider.verifyPayment({
        orderId: order.paymentOrderId,
        paymentId: input.paymentId,
        signature: input.signature,
      }));
  }

  // Determine the paymentId to store — PhonePe sends it via webhook but not
  // the redirect; store the txnId/orderId as a fallback so the row is populated.
  const resolvedPaymentId =
    "txnId" in input ? (order.paymentOrderId ?? input.txnId) : input.paymentId;

  if (!signatureValid) {
    await markOrderFailed(order.id);
    return { ok: false, message: "Payment verification failed. Nothing was charged." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of order!.items) {
        await lockVariant(tx, item.variantId);
        const available = await availableInTx(tx, item.variantId);
        if (available < item.quantity) {
          throw new Error("OOS");
        }
      }

      for (const item of order!.items) {
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: {
            stockQuantity: { decrement: item.quantity },
            reservedQuantity: { decrement: item.quantity },
          },
        });
      }

      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      await tx.order.update({
        where: { id: order!.id },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentId: resolvedPaymentId,
        },
      });
    });
  } catch {
    await markOrderFailed(order.id);
    return {
      ok: false,
      message: "Some items went out of stock before payment. Nothing was charged.",
    };
  }

  return { ok: true, orderNumber: order.orderNumber };
}

/* ───────── cancel / release ───────── */

// Frees reserved inventory and marks the order CANCELLED / payment FAILED.
async function markOrderFailed(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { variantId: true, quantity: true },
  });
  if (items.length === 0) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await lockVariant(tx, item.variantId);
      const inv = await tx.inventory.findUnique({
        where: { variantId: item.variantId },
        select: { reservedQuantity: true },
      });
      const reserved = Math.max(0, (inv?.reservedQuantity ?? 0) - item.quantity);
      await tx.inventory.update({
        where: { variantId: item.variantId },
        data: { reservedQuantity: reserved },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    });
  });
}

export async function cancelOrder(orderId: string): Promise<OrderActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentId: true,
      total: true,
      items: { select: { variantId: true, quantity: true } },
    },
  });

  if (!order) return { ok: false, message: "Order not found." };

  if (order.status === "PENDING") {
    await markOrderFailed(order.id);
    return { ok: true, message: "Order cancelled." };
  }

  if (order.status === "CONFIRMED") {
    // Restore stockQuantity back to inventory for cancelled confirmed orders
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await lockVariant(tx, item.variantId);
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : "FAILED",
        },
      });
    });

    // Attempt PhonePe refund if order was paid.
    // order.orderNumber = merchantTransactionId, order.paymentId = PhonePe transactionId.
    if (order.paymentStatus === "PAID" && order.paymentId) {
      try {
        const { PhonePeProvider } = await import("@/lib/phonepe");
        const phonePeProvider = new PhonePeProvider();
        const refundResult = await phonePeProvider.refundPayment(
          order.orderNumber,
          order.paymentId,
          Number(order.total)
        );
        await prisma.refund.create({
          data: {
            orderId: order.id,
            razorpayRefundId: refundResult.id, // column reused for PhonePe refund txnId
            amount: refundResult.amount,
            status: refundResult.status,
            reason: "Customer order cancellation",
          },
        });
      } catch (err) {
        console.error("Automated PhonePe refund error on cancellation:", err);
      }
    }

    return { ok: true, message: "Order cancelled and refund initiated." };
  }

  return { ok: false, message: "Orders in PACKED, SHIPPED or DELIVERED status cannot be cancelled directly." };
}