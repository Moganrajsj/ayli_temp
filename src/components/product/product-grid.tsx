import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ProductGridProps {
  children: ReactNode;
  className?: string;
}

/** Responsive product card grid — 2 cols mobile, 3 tablet, 4 desktop. */
export function ProductGrid({ children, className }: ProductGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}