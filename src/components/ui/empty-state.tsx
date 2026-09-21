import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";

export interface EmptyStateProps {
  icon?: IconName;
  iconSolid?: boolean;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = "heart",
  iconSolid = false,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const node = action ?? null;
  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-soft-beige">
          <Icon name={icon} solid={iconSolid} className="h-7 w-7 text-ayli-blue" />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
        {node}
      </div>
    </div>
  );
}