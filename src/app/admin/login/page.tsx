import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Sign In | AYLI",
  description: "Administrator sign in to the AYLI management console.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.id && session.user.role === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-dvh bg-[#f8f5f2] flex flex-col">
      {/* Top bar */}
      <header className="border-b border-[#e8e2dc] bg-white px-6 py-4 flex items-center justify-between">
        <Logo />
        <Link href="/" className="text-xs text-[#888] hover:text-[#333] transition-colors">
          ← Back to store
        </Link>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-2xl border border-[#e8e2dc] bg-white px-8 py-10 shadow-sm">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f0ebe6]">
                <svg className="h-5 w-5 text-[#6b4c3b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="font-display text-xl font-semibold text-[#1a1a1a]">Admin Sign In</h1>
              <p className="mt-1 text-sm text-[#888]">AYLI Management Console</p>
            </div>

            <AdminLoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-[#aaa]">
            Authorized personnel only
          </p>
        </div>
      </main>
    </div>
  );
}