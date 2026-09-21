import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export interface AccordionItem {
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

/** Native `<details>` accordion — animates/works with no client JS. */
export function Accordion({ items, className }: AccordionProps) {
  return (
    <div className={cn("border-y border-hairline", className)}>
      {items.map((item) => (
        <details key={item.title} className="group border-b border-hairline last:border-b-0">
          <summary
            className="flex cursor-pointer select-none list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden"
          >
            <span className="text-sm font-medium text-ink">{item.title}</span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition-transform duration-300 group-open:rotate-180">
              <Icon name="chevron-down" className="h-4 w-4" />
            </span>
          </summary>
          <div className="pb-5 text-sm leading-relaxed text-muted">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}