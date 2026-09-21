"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-rose-mist text-ayli-peach">
        <Icon name="heart" solid className="h-7 w-7 text-ayli-peach" />
      </span>
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Something went a little sideways
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
          An unexpected error interrupted your visit. Try again — and if it
          persists, message us on WhatsApp and we&apos;ll sort it out.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={retry}>
          <Icon name="sparkles" className="h-4 w-4" />
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-plum transition-colors hover:text-ayli-peach"
        >
          Back to home <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
      {error.digest ? (
        <p className="text-xs text-muted">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}