"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-soft-beige text-ayli-blue">
        <Icon name="briefcase" className="h-6 w-6" />
      </div>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Admin Console Notice
      </h2>
      <p className="mt-2 text-sm text-muted">
        A temporary error occurred while processing admin data (such as database connection queueing). You can retry or return to the main dashboard.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex h-11 items-center rounded-pill bg-ayli-blue px-6 text-sm font-medium text-white shadow-soft transition-colors hover:bg-[#1ba9bc]"
        >
          Retry
        </button>
        <Link
          href="/admin"
          className="inline-flex h-11 items-center rounded-pill border border-hairline bg-white px-6 text-sm font-medium text-ink transition-colors hover:bg-soft-beige"
        >
          Reload Admin
        </Link>
      </div>
    </div>
  );
}
