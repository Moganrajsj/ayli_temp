import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast && "font-medium text-ink")}>
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <Icon
                  name="chevron-right"
                  className="h-3 w-3 text-muted/60"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}