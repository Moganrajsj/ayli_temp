import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  PENDING: "bg-soft-beige text-muted",
  CONFIRMED: "bg-ayli-blue/10 text-ayli-blue",
  PACKED: "bg-ayli-blue/10 text-ayli-blue",
  SHIPPED: "bg-ayli-peach/20 text-[#b05a33]",
  DELIVERED: "bg-success/10 text-success",
  CANCELLED: "bg-danger/10 text-danger",
  RETURNED: "bg-danger/10 text-danger",
  REFUNDED: "bg-danger/10 text-danger",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-pill px-2.5 py-1 text-xs font-semibold",
        TONES[status] ?? "bg-soft-beige text-muted",
      )}
    >
      {label}
    </span>
  );
}