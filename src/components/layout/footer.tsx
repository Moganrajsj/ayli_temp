import Link from "next/link";
import { APP_NAME, whatsappUrl } from "@/config/constants";
import { categoryUrl } from "@/config/navigation";

const SHOP_LINKS = [
  { name: "New Arrivals", href: "/collection/new-arrivals" },
  { name: "Kurtis & Tops", href: categoryUrl("kurtis-tops") },
  { name: "Co-ord Sets", href: categoryUrl("co-ord-sets") },
  { name: "Dresses", href: categoryUrl("dresses") },
  { name: "Bottoms", href: categoryUrl("bottoms") },
  { name: "Fabrics", href: categoryUrl("fabrics") },
  { name: "Accessories", href: categoryUrl("accessories") },
];

const HELP_LINKS = [
  { name: "Size Guide", href: "/size-guide" },
  { name: "Care Guide", href: "/care-guide" },
  { name: "Shipping Policy", href: "/shipping-policy" },
  { name: "Return & Refund", href: "/return-refund" },
  { name: "FAQ", href: "/faq" },
];

const COMPANY_LINKS = [
  { name: "About AYLI", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms & Conditions", href: "/terms" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-gradient-to-br from-[#2A1820] via-[#3D1F2E] to-[#1E1018] pt-16 pb-28 lg:pb-10">
      <div className="mx-auto max-w-7xl px-5">
        {/* Decorative rose divider */}
        <div className="mb-12 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ayli-peach/30 to-transparent" />
          <span className="text-ayli-peach/60 text-lg select-none">&#10047;</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ayli-peach/30 to-transparent" />
        </div>

        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-4">
            <p className="font-display text-3xl font-bold tracking-tight text-white">
              {APP_NAME}
              <span className="text-ayli-peach">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              Everyday fashion for the modern Indian woman &mdash; beautifully made, honestly priced, and
              designed to move with you.
            </p>

          </div>

          {/* Shop */}
          <div className="lg:col-span-3">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-wider text-ayli-peach/70">Shop</h4>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/50 transition-colors hover:text-ayli-peach">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="lg:col-span-3">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-wider text-ayli-peach/70">Help</h4>
            <ul className="space-y-3">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/50 transition-colors hover:text-ayli-peach">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-wider text-ayli-peach/70">Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/50 transition-colors hover:text-ayli-peach">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 lg:flex-row">
          <p className="text-xs text-white/30">
            &copy; {year} {APP_NAME}. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a
              href={whatsappUrl("Hi AYLI, I need help")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ayli-peach/30 px-4 py-2 text-xs font-medium text-ayli-peach/70 transition-colors hover:border-ayli-peach hover:text-ayli-peach"
            >
              Chat on WhatsApp
            </a>
            <span className="text-xs text-white/30">UPI &middot; Cards &middot; Netbanking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
