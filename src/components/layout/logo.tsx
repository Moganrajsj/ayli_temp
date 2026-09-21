import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="AYLI home"
      className={`font-display text-2xl font-bold tracking-tight text-ink transition-opacity hover:opacity-80 ${className ?? ""}`}
    >
      AYLI<span className="text-ayli-peach">.</span>
    </Link>
  );
}