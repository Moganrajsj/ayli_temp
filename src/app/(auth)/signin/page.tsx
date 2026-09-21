import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "@/components/auth/signin-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AYLI account.",
};

function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/account";
  }
  return value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const next = safeCallbackUrl(callbackUrl);

  if (next.startsWith("/admin")) {
    redirect("/admin/login");
  }

  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to your AYLI account. New here?{" "}
          <Link href={`/signup?callbackUrl=${encodeURIComponent(next)}`} className="font-medium text-ayli-blue underline-offset-2 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <SignInForm callbackUrl={next} />

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted">or</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <GoogleButton callbackUrl={next} />
    </div>
  );
}