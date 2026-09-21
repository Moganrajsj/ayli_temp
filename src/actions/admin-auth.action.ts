"use server";

import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export interface AdminSignInResult {
  ok: boolean;
  message?: string;
}

/**
 * Ensures an admin user exists in the database.
 * If no admin user is present, creates default admin: admin@ayli.in / Admin@123456
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const existing = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (!existing) {
      const passwordHash = await hashPassword("Admin@123456");
      await prisma.user.upsert({
        where: { email: "admin@ayli.in" },
        update: { role: "ADMIN", password: passwordHash },
        create: {
          email: "admin@ayli.in",
          name: "AYLI Administrator",
          role: "ADMIN",
          password: passwordHash,
        },
      });
      console.log("Default admin account provisioned: admin@ayli.in");
    }
  } catch (err) {
    console.error("Failed to ensure default admin account:", err);
  }
}

export async function adminSignInAction(
  _prevState: AdminSignInResult | undefined,
  formData: FormData
): Promise<AdminSignInResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      ok: false,
      message: "Please enter both administrator email and password.",
    };
  }

  // Ensure an admin user exists
  await ensureDefaultAdmin();

  // Strict role verification: only users with role === 'ADMIN' are allowed to authenticate via admin portal
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, password: true },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      ok: false,
      message:
        "Access denied. This account does not possess administrator privileges.",
    };
  }

  if (!user.password) {
    return {
      ok: false,
      message: "Invalid administrator credentials.",
    };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return {
      ok: false,
      message: "Invalid administrator credentials. Please try again.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        message: "Authentication failed. Please verify your credentials.",
      };
    }
    // signIn throws Next.js redirect exception; rethrow it so Next.js redirects to /admin
    throw error;
  }

  return { ok: true };
}

export async function adminSignOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
