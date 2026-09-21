import { Icon, type IconName } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type TimelineStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

const HAPPY_PATH: Array<{ status: TimelineStatus; label: string; icon: IconName }> = [
  { status: "CONFIRMED", label: "Confirmed", icon: "check" },
  { status: "PACKED", label: "Packed", icon: "box" },
  { status: "SHIPPED", label: "Shipped", icon: "truck" },
  { status: "DELIVERED", label: "Delivered", icon: "home" },
];

const STEP_ORDER: Record<TimelineStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PACKED: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  RETURNED: -2,
  REFUNDED: -3,
};

interface OrderStatusTimelineProps {
  status: TimelineStatus;
  shippedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
}

const fmt = (value?: Date | string | null) =>
  value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value)) : null;

export function OrderStatusTimeline({ status, shippedAt, deliveredAt }: OrderStatusTimelineProps) {
  const current = STEP_ORDER[status];

  // Terminal non-happy-path states collapse to a single notice.
  if (current < 0) {
    const icon: IconName = status === "CANCELLED" ? "x" : "logout";
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    return (
      <div className="flex items-center gap-4 rounded-card border border-hairline bg-soft-beige/60 px-5 py-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink">
          This order was <span className="font-semibold">{label.toLowerCase()}</span>.{" "}
          {status === "CANCELLED" ? "No payment was captured." : "A refund, if applicable, is initiated with the payment gateway."}
        </p>
      </div>
    );
  }

  return (
    <ol className="flex items-start gap-0">
      {HAPPY_PATH.map((step, index) => {
        const isCurrent = current === STEP_ORDER[step.status];
        const isDone = current > STEP_ORDER[step.status];
        const date = step.status === "SHIPPED" ? shippedAt : step.status === "DELIVERED" ? deliveredAt : null;

        return (
          <li key={step.status} className={cn("flex items-start", index === HAPPY_PATH.length - 1 ? "flex-1" : "flex-1")}>
            <div className="flex w-full flex-col">
              <div className="flex items-center">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
                    isDone && "border-ayli-blue bg-ayli-blue text-white",
                    isCurrent && !isDone && "border-ayli-blue bg-warm-white text-ayli-blue",
                    !isDone && !isCurrent && "border-hairline bg-warm-white text-muted",
                  )}
                >
                  <Icon name={step.icon} className="h-4 w-4" />
                </span>
                {index < HAPPY_PATH.length - 1 ? (
                  <span
                    className={cn("mx-2 h-0.5 flex-1 rounded-full", isDone ? "bg-ayli-blue" : "bg-hairline")}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-2 text-xs font-medium",
                  isDone || isCurrent ? "text-ink" : "text-muted",
                )}
              >
                {step.label}
              </p>
              {date || isCurrent ? (
                <p className="text-xs text-muted">
                  {date ? fmt(date) : isCurrent ? "Now" : ""}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}