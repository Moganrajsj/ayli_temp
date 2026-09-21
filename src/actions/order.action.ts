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
  EXPRESS_SHIPPING_FEE,
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
  await tx.$queryRaw`SELECT id FROM \`Inventory\` WHERE variantId = ${variantId} FOR UPDATE`;
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

  const { id: _discard, isDefault, ...data } = parsed.data;

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
}

/* ───────── place order ───────── */

export async function placeOrder(
  addressId: string,
  method: ShippingMethod,
): Promise<OrderActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };

  if (method !== "standard" && method !== "express") {
    return { ok: false, message: "Invalid shipping method." };
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
  const shipping = computedShipping(method, sellingTotal);
  const total = sellingTotal + shipping;
  const orderNumber = nextOrderNumber();
  const gateway = paymentProvider.gateway;

  const order = await prisma.$transaction(async (tx) => {
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
        paymentMethod: gateway,
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

  let payment;
  try {
    payment = await paymentProvider.createOrder({
      amount: total,
      currency: "INR",
      receipt: orderNumber,
    });
  } catch {
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
  };
}

/* ───────── confirm payment ───────── */

export async function verifyAndConfirmOrder(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<OrderActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: user.id, status: "PENDING" },
    select: {
      id: true,
      orderNumber: true,
      paymentOrderId: true,
      items: { select: { variantId: true, quantity: true } },
    },
  });
  if (!order) return { ok: false, message: "This order is no longer pending." };

  const signatureValid =
    order.paymentOrderId != null &&
    (await paymentProvider.verifyPayment({
      orderId: order.paymentOrderId,
      paymentId: input.paymentId,
      signature: input.signature,
    }));

  if (!signatureValid) {
    await markOrderFailed(order.id);
    return { ok: false, message: "Payment verification failed. Nothing was charged." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await lockVariant(tx, item.variantId);
        const available = await availableInTx(tx, item.variantId);
        if (available < item.quantity) {
          throw new Error("OOS");
        }
      }

      for (const item of order.items) {
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
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentId: input.paymentId,
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
    where: { id: orderId, userId: user.id, status: "PENDING" },
    select: { id: true },
  });
  if (!order) return { ok: false, message: "This order is no longer pending." };

  await markOrderFailed(order.id);
  return { ok: true, message: "Order cancelled." };
}