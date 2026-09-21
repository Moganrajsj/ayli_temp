import Link from "next/link";
import { buildCatalogUrl } from "@/lib/catalog-url";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export interface PaginationProps {
  pathname: string;
  current: Record<string, string | string[] | undefined>;
  currentPage: number;
  pageCount: number;
  className?: string;
}

function pageWindow(current: number, count: number): number[] {
  const max = 7;
  if (count <= max) {
    return Array.from({ length: count }, (_, i) => i + 1);
  }
  const start = Math.max(2, current - 2);
  const end = Math.min(count - 1, current + 2);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  pathname,
  current,
  currentPage,
  pageCount,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const pageHref = (page: number) =>
    buildCatalogUrl(pathname, current, { page });
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= pageCount;
  const windowPages = pageWindow(currentPage, pageCount);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {prevDisabled ? (
        <span className="grid h-10 w-10 place-items-center rounded-full text-muted/40">
          <Icon name="chevron-left" className="h-5 w-5" />
        </span>
      ) : (
        <Link
          href={pageHref(currentPage - 1)}
          aria-label="Previous page"
          className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-soft-beige"
        >
          <Icon name="chevron-left" className="h-5 w-5" />
        </Link>
      )}

      {windowPages[0] > 2 ? <Ellipsis /> : null}
      {windowPages.map((page) =>
        page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className="grid h-10 w-10 place-items-center rounded-full bg-ayli-blue font-semibold text-white"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={pageHref(page)}
            aria-label={`Page ${page}`}
            className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-soft-beige"
          >
            {page}
          </Link>
        )
      )}
      {windowPages[windowPages.length - 1] < pageCount - 1 ? <Ellipsis /> : null}
      {windowPages.includes(pageCount) ? null : (
        <Link
          href={pageHref(pageCount)}
          aria-label={`Last page, page ${pageCount}`}
          className="grid h-10 min-w-10 place-items-center rounded-full px-1 text-ink transition-colors hover:bg-soft-beige"
        >
          {pageCount}
        </Link>
      )}

      {nextDisabled ? (
        <span className="grid h-10 w-10 place-items-center rounded-full text-muted/40">
          <Icon name="chevron-right" className="h-5 w-5" />
        </span>
      ) : (
        <Link
          href={pageHref(currentPage + 1)}
          aria-label="Next page"
          className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-soft-beige"
        >
          <Icon name="chevron-right" className="h-5 w-5" />
        </Link>
      )}
    </nav>
  );
}

function Ellipsis() {
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-6 place-items-center text-muted"
    >
      …
    </span>
  );
}