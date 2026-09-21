"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icons";

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

function AccountNavItems({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items: NavItem[] = [
    { label: "Overview", href: "/account", icon: "user" },
    { label: "Orders", href: "/account/orders", icon: "box" },
    { label: "Addresses", href: "/account/addresses", icon: "map-pin" },
    { label: "Profile", href: "/account/profile", icon: "edit" },
    ...(isAdmin
      ? [{ label: "Admin", href: "/admin", icon: "briefcase" as const }]
      : []),
  ];

  return items.map((item) => {
    const isActive =
      item.href === "/account"
        ? pathname === "/account"
        : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-2.5 rounded-card px-4 py-3 text-[15px] font-medium transition-colors",
          isActive
            ? "bg-ayli-blue/10 text-ayli-blue"
            : "text-ink hover:bg-soft-beige"
        )}
      >
        <Icon name={item.icon} className="h-5 w-5" />
        {item.label}
      </Link>
    );
  });
}

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav
      aria-label="Account"
      className="grid gap-1 rounded-card border border-hairline bg-warm-white p-2"
    >
      <AccountNavItems isAdmin={isAdmin} />
    </nav>
  );
}