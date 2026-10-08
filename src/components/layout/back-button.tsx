"use client";

import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function BackButton({
  fallbackHref = "/",
  className,
}: {
  fallbackHref?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") return null;

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-rose-mist hover:text-ayli-peach",
        className
      )}
    >
      <Icon name="chevron-left" className="h-5 w-5" />
    </button>
  );
}
