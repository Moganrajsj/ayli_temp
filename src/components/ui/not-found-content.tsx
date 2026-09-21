import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-rose-mist text-ayli-peach">
        <Icon name="sparkles" className="h-8 w-8" />
      </span>
      <p className="font-display text-6xl font-semibold tracking-tight text-plum">
        404
      </p>
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          This page has wandered off
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
          We couldn&apos;t find what you were looking for. The good news — there&apos;s a
          whole edit waiting to be discovered.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button href="/">Back to home</Button>
        <Link
          href="/category/kurtis-tops"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-plum transition-colors hover:text-ayli-peach"
        >
          Browse kurtis <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}