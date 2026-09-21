import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your AYLI account.",
};

function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/account";
  }
  return value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const next = safeCallbackUrl(callbackUrl);

  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Join AYLI for faster checkout, saved addresses and order tracking.{" "}
          <Link href={`/signin?callbackUrl=${encodeURIComponent(next)}`} className="font-medium text-ayli-blue underline-offset-2 hover:underline">
            Have an account? Sign in
          </Link>
        </p>
      </div>

      <SignUpForm callbackUrl={next} />

      <p className="text-xs leading-relaxed text-muted">
        By creating an account you agree to AYLI&apos;s terms &amp; conditions and privacy
        policy.
      </p>
    </div>
  );
}