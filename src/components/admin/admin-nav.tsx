"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/homepage", label: "Homepage", icon: "sparkles" },
  { href: "/admin/products", label: "Products", icon: "bag" },
  { href: "/admin/categories", label: "Categories", icon: "briefcase" },
  { href: "/admin/orders", label: "Orders", icon: "box" },
  { href: "/admin/inventory", label: "Inventory", icon: "truck" },
  { href: "/admin/customers", label: "Customers", icon: "user" },
];

export function AdminNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  const items = NAV_ITEMS.map((item) => {
    const active =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-card px-3.5 py-2.5 text-[15px] font-medium transition-colors",
          orientation === "horizontal" && "flex-col gap-1 px-3 py-2 text-xs",
          active
            ? "bg-ayli-blue/10 text-ayli-blue"
            : "text-ink hover:bg-soft-beige hover:text-ink",
        )}
      >
        <Icon name={item.icon} className={cn("h-5 w-5", orientation === "horizontal" && "h-5 w-5")} />
        {item.label}
      </Link>
    );
  });

  if (orientation === "horizontal") {
    return (
      <nav aria-label="Admin navigation" className="flex overflow-x-auto">
        {items}
      </nav>
    );
  }

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      <p className="px-3.5 pb-1 text-xs font-semibold uppercase tracking-widest text-muted">
        Manage
      </p>
      {items}
    </nav>
  );
}