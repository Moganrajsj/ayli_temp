"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_CATEGORIES, categoryUrl } from "@/config/navigation";
import { SHOP_YOUR_WAY } from "@/config/collections";
import { Sheet } from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icons";

const HELP_LINKS = [
  { name: "Your Orders", href: "/account/orders", icon: "box" as const },
  { name: "Size Guide", href: "/size-guide", icon: "compass" as const },
  { name: "Contact Us", href: "/contact", icon: "map-pin" as const },
  { name: "FAQ", href: "/faq", icon: "search" as const },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium text-muted transition-colors hover:text-ink"
      >
        <Icon name="menu" className="h-6 w-6" />
        <span className="tracking-wide">Menu</span>
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Menu"
        position="right"
        size="md"
      >
        <nav aria-label="Mobile menu" className="px-5 py-4">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-card border border-hairline bg-warm-white px-4 py-3"
          >
            <span className="font-display text-sm font-semibold text-ink">My Account</span>
            <Icon name="user" className="h-5 w-5 text-ayli-blue" />
          </Link>

          <Link
            href="/search"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center gap-3 rounded-card border border-hairline bg-warm-white px-4 py-3"
          >
            <Icon name="search" className="h-5 w-5 text-ayli-blue" />
            <span className="flex-1 truncate text-sm text-muted">Search styles, fabrics, colours…</span>
          </Link>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Shop by category</p>
            <ul className="mt-3 space-y-1">
              {NAV_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={categoryUrl(cat.slug)}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-soft-beige"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Shop by occasion</p>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {SHOP_YOUR_WAY.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`/collection/${entry.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-card border border-hairline bg-warm-white px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ayli-blue/40"
                  >
                    {entry.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-hairline pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Help</p>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-card px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-soft-beige"
                    )}
                  >
                    <Icon name={link.icon} className="h-4 w-4 text-ayli-blue" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-card bg-soft-beige px-4 py-3">
            <Icon name="whatsapp" className="h-4 w-4 text-ayli-blue" />
            <span className="text-sm text-muted">Questions? We&apos;re a message away.</span>
          </div>
        </nav>
      </Sheet>
    </>
  );
}