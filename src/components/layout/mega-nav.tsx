import Link from "next/link";
import { NAV_CATEGORIES, categoryUrl } from "@/config/navigation";

export function MegaNav() {
  return (
    <nav aria-label="Product categories" className="hidden lg:flex items-center gap-6 text-[13px] font-medium tracking-wide uppercase text-muted">
      {NAV_CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={categoryUrl(cat.slug)}
          className="relative py-1 transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-ayli-blue after:transition-transform hover:text-ink hover:after:scale-x-100"
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}