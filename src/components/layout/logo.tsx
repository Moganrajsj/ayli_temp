import Link from "next/link";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="AYLI home"
      className={`font-display text-2xl font-bold tracking-tight text-ink transition-opacity hover:opacity-80 ${className ?? ""}`}
    >
      AYLI<span className="text-ayli-peach">.</span>
    </Link>
  );
}