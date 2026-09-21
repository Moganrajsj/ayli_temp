"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addressSchema, formatFieldErrors } from "@/lib/validation";

/* ───────── helpers ───────── */

interface AuthUser {
  id: string;
  role: string;
}

async function assertUser(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return { id: session.user.id, role: session.user.role };
}

/* ───────── profile schemas ───────── */

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Please enter a valid 10-digit phone number.")
    .or(z.literal(""))
    .optional()
    .default(""),
});

/* ───────── profile actions ───────── */

export async function updateProfile(
  _prevState: { ok: boolean; message: string; fieldErrors: Record<string, string> } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string; fieldErrors: Record<string, string> }> {
  const user = await assertUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: formatFieldErrors(parsed.error.issues),
    };
  }

  const { name, email, phone } = parsed.data;

  // Check email uniqueness (excluding self)
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      message: "This email is already linked to another account.",
      fieldErrors: { email: "Email is already in use." },
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email, phone: phone || null },
  });

  redirect("/account/profile?updated=1");
}

/* ───────── address actions ───────── */

export async function listAddresses() {
  const user = await assertUser();
  return prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(
  _prevState: { ok: boolean; message: string; fieldErrors: Record<string, string> } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string; fieldErrors: Record<string, string> }> {
  const user = await assertUser();

  const parsed = addressSchema.safeParse({
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

  await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If no addresses exist yet, force default
    const count = await tx.address.count({ where: { userId: user.id } });

    await tx.address.create({
      data: { ...data, userId: user.id, isDefault: isDefault || count === 0 },
    });
  });

  redirect("/account/addresses?created=1");
}

export async function updateAddress(
  _prevState: { ok: boolean; message: string; fieldErrors: Record<string, string> } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string; fieldErrors: Record<string, string> }> {
  const user = await assertUser();

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

  const { id, isDefault, ...data } = parsed.data;
  if (!id) return { ok: false, message: "Address ID is missing.", fieldErrors: {} };

  // Verify the address belongs to this user
  const address = await prisma.address.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!address) return { ok: false, message: "Address not found.", fieldErrors: {} };

  await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    await tx.address.update({ where: { id }, data: { ...data, isDefault } });
  });

  redirect("/account/addresses?updated=1");
}

export async function deleteAddress(formData: FormData) {
  const user = await assertUser();
  const addressId = String(formData.get("id") ?? "");
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
    select: { id: true, isDefault: true },
  });
  if (!address) redirect("/account/addresses");

  await prisma.address.delete({ where: { id: addressId } });

  // If we deleted the default, promote the most recent remaining address
  if (address.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  redirect("/account/addresses?deleted=1");
}

export async function setDefaultAddress(formData: FormData) {
  const user = await assertUser();
  const addressId = String(formData.get("id") ?? "");
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
    select: { id: true },
  });
  if (!address) redirect("/account/addresses");

  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
    await tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  });

  redirect("/account/addresses?default=1");
}