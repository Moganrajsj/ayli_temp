"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icons";
import { CartBadge } from "@/components/cart/cart-badge";
import { MobileMenu } from "@/components/layout/mobile-menu";

interface NavItem {
  name: string;
  href: string;
  icon: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/", icon: "home" },
  { name: "Explore", href: "/category/kurtis-tops", icon: "compass" },
  { name: "Wishlist", href: "/wishlist", icon: "heart" },
  { name: "Bag", href: "/cart", icon: "bag" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline/60 bg-warm-white/97 backdrop-blur-lg lg:hidden"
    >
      <ul className="flex items-stretch justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                aria-label={item.name}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition-colors",
                  isActive ? "text-ayli-peach" : "text-muted hover:text-ink"
                )}
              >
<span className="relative">
                  {isActive && (
                    <span className="absolute -inset-1 rounded-full bg-rose-mist transition-transform duration-300 ease-out-soft" />
                  )}
                  <Icon
                    name={item.icon}
                    className={cn(
                      "relative h-6 w-6 transition-all duration-200 ease-out-soft",
                      isActive && "scale-110 text-ayli-peach"
                    )}
                  />
                  {item.name === "Bag" ? <CartBadge /> : null}
                </span>
                <span className="tracking-wide">{item.name}</span>
              </Link>
            </li>
          );
        })}
        <li key="menu">
          <MobileMenu />
        </li>
      </ul>
    </nav>
  );
}
