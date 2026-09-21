import Link from "next/link";
import { Icon } from "@/components/ui/icons";

export function AccountBreadcrumb({ page }: { page: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm">
      <Link href="/" className="text-muted transition-colors hover:text-ink">
        Home
      </Link>
      <Icon name="chevron-right" className="h-3.5 w-3.5 text-muted" />
      <Link href="/account" className="text-muted transition-colors hover:text-ink">
        My account
      </Link>
      <Icon name="chevron-right" className="h-3.5 w-3.5 text-muted" />
      <span className="font-medium text-ink">{page}</span>
    </nav>
  );
}