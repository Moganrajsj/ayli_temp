"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

/* ───────── schemas ───────── */

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name.").max(80),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

function safeCallbackUrl(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/account";
  }
  return raw;
}

/* ───────── actions ───────── */

export async function signInWithCredentials(
  _prevState: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Invalid email or password." };
    }
    throw error;
  }
  // signIn throws a NEXT_REDIRECT; this line is only reached on redirect failure.
  return { ok: false, message: "Unable to sign in. Please try again." };
}

export async function signInWithGoogle(
  _prevState: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));
  try {
    await signIn("google", { redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Unable to sign in with Google." };
    }
    throw error;
  }
  return { ok: false, message: "Unable to sign in with Google. Please try again." };
}

export async function registerUser(
  _prevState: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      message: "An account with this email already exists. Try signing in instead.",
    };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email, name, password: passwordHash, role: "CUSTOMER" },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
  });

  return { ok: false, message: "Registration failed. Please try again." };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}