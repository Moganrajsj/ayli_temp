import { cn, discountPercent, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface PriceBlockProps {
  mrp: number;
  sellingPrice: number;
  size?: "sm" | "md";
  className?: string;
}

export function PriceBlock({
  mrp,
  sellingPrice,
  size = "md",
  className,
}: PriceBlockProps) {
  const discount = sellingPrice < mrp ? discountPercent(mrp, sellingPrice) : 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-0.5",
        className
      )}
    >
      <span
        className={cn(
          "font-semibold text-ink",
          size === "md" ? "text-base" : "text-sm"
        )}
      >
        {formatINR(sellingPrice)}
      </span>
      {discount > 0 ? (
        <>
          <span className="text-xs text-muted line-through">
            {formatINR(mrp)}
          </span>
          <Badge variant="discount" className="px-1.5 py-0 text-[11px]">
            {discount}% off
          </Badge>
        </>
      ) : null}
    </div>
  );
}