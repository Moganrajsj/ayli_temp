import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "View all",
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        align === "center" && "flex-col items-center text-center",
        className
      )}
    >
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        {eyebrow ? (
          <div className={cn("mb-3 flex items-center gap-3", align === "center" && "justify-center")}>
            <div className="h-px w-6 bg-ayli-peach/50" />
            <p className="text-xs font-semibold uppercase tracking-[0.20em] text-ayli-peach">
              {eyebrow}
            </p>
            <div className="h-px w-6 bg-ayli-peach/50" />
          </div>
        ) : null}
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ayli-peach"
        >
          {hrefLabel}
          <Icon
            name="arrow-right"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ) : null}
    </div>
  );
}
