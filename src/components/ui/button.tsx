import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "peach";
type Size = "sm" | "md" | "lg";

export const BUTTON_VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ayli-peach text-white hover:bg-[#f07090] active:bg-[#e06080] shadow-peach hover:shadow-glow",
  secondary:
    "border border-hairline bg-warm-white text-ink hover:border-ayli-peach/50 hover:bg-rose-mist hover:text-plum",
  peach:
    "bg-ayli-peach text-white hover:bg-[#f07090] active:bg-[#e06080] shadow-peach",
  ghost: "text-ink hover:bg-rose-mist hover:text-plum",
};

export const BUTTON_SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-6 text-[15px] gap-2",
  lg: "h-13 px-8 text-base gap-2.5",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center rounded-pill font-display font-medium",
    "transition-all duration-200 ease-out select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ayli-peach",
    fullWidth ? "w-full" : undefined,
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className
  );
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

interface ButtonAsButton extends ButtonHTMLAttributes<HTMLButtonElement>, CommonProps {
  href?: undefined;
}

interface ButtonAsLink extends AnchorHTMLAttributes<HTMLAnchorElement>, CommonProps {
  href: string;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    buttonClasses({ variant, size, fullWidth }),
    className
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} disabled={isLoading || buttonProps.disabled} {...buttonProps}>
      {isLoading ? <Spinner size={size} /> : null}
      {isLoading ? null : children}
    </button>
  );
}

function Spinner({ size }: { size: Size }) {
  const dim = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";
  return (
    <svg
      className={cn(`${dim} animate-spin`)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
