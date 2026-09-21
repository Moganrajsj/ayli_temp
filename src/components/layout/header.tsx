import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { MegaNav } from "@/components/layout/mega-nav";
import { Icon } from "@/components/ui/icons";
import { CartBadge } from "@/components/cart/cart-badge";

export function Header() {
  return (
    <header
      className="sticky top-0 z-30"
      style={{ viewTransitionName: "site-header" }}
    >
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-plum via-[#9C3A58] to-ayli-peach px-4 py-2 text-center text-xs font-medium text-white/90 tracking-wide">
        🌸 Free shipping on orders above ₹999 &nbsp;·&nbsp; Easy 15-day returns 🌸
      </div>

      {/* Main header */}
      <div className="bg-warm-white/96 backdrop-blur-md border-b border-hairline/60">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          {/* Mobile header row */}
          <div className="flex h-14 items-center justify-between lg:hidden">
            <Logo />
            <nav aria-label="Quick access" className="flex items-center gap-1">
              <Link
                href="/search"
                aria-label="Search"
                className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-rose-mist hover:text-ayli-peach"
              >
                <Icon name="search" className="h-[22px] w-[22px]" />
              </Link>
              <Link
                href="/account"
                aria-label="Account"
                className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-rose-mist hover:text-ayli-peach"
              >
                <Icon name="user" className="h-[22px] w-[22px]" />
              </Link>
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-rose-mist hover:text-ayli-peach"
              >
                <Icon name="heart" className="h-[22px] w-[22px]" />
              </Link>
              <Link
                href="/cart"
                aria-label="Shopping bag"
                className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-rose-mist hover:text-ayli-peach"
              >
                <span className="relative">
                  <Icon name="bag" className="h-[22px] w-[22px]" />
                  <CartBadge />
                </span>
              </Link>
            </nav>
          </div>

          {/* Desktop header row */}
          <div className="hidden h-16 items-center gap-8 lg:flex">
            <Logo className="mr-4 shrink-0" />
            <MegaNav />
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/search"
                aria-label="Search"
                className="grid h-10 w-10 place-items-center rounded-full text-ink transition-all duration-200 hover:bg-rose-mist hover:text-ayli-peach"
              >
                <Icon name="search" className="h-5 w-5" />
              </Link>
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="grid h-10 w-10 place-items-center rounded-full text-ink transition-all duration-200 hover:bg-rose-mist hover:text-ayli-peach"
              >
                <Icon name="heart" className="h-5 w-5" />
              </Link>
              <Link
                href="/cart"
                aria-label="Shopping bag"
                className="grid h-10 w-10 place-items-center rounded-full text-ink transition-all duration-200 hover:bg-rose-mist hover:text-ayli-peach"
              >
                <span className="relative">
                  <Icon name="bag" className="h-5 w-5" />
                  <CartBadge />
                </span>
              </Link>
              <Link
                href="/account"
                aria-label="Account"
                className="grid h-10 w-10 place-items-center rounded-full text-ink transition-all duration-200 hover:bg-rose-mist hover:text-ayli-peach"
              >
                <Icon name="user" className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}