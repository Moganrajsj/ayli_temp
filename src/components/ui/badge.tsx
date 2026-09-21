import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "neutral" | "blue" | "peach" | "success" | "danger" | "discount" | "bestseller";

export interface BadgeProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  neutral: "bg-soft-beige text-muted",
  blue: "bg-ayli-blue/12 text-ayli-blue",
  peach: "bg-rose-mist text-plum",
  success: "bg-success/12 text-success",
  danger: "bg-danger/12 text-danger",
  discount: "bg-gradient-to-r from-ayli-peach to-[#FF6B8A] text-white shadow-sm",
  bestseller: "bg-gradient-to-r from-gold/20 to-gold/10 text-[#8B6914] border border-gold/30",
};

export function Badge({ variant = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
