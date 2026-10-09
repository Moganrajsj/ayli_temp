"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Account error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-soft-beige text-ayli-blue">
        <Icon name="sparkles" className="h-6 w-6" />
      </div>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Unable to load account details
      </h2>
      <p className="mt-2 text-sm text-muted">
        We ran into a temporary issue retrieving your account information. Please try again or head back to shopping.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex h-11 items-center rounded-pill bg-ayli-blue px-6 text-sm font-medium text-white shadow-soft transition-colors hover:bg-[#1ba9bc]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-pill border border-hairline bg-white px-6 text-sm font-medium text-ink transition-colors hover:bg-soft-beige"
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}
