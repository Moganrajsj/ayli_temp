"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/use-dialog";
import { Icon } from "@/components/ui/icons";

type Position = "bottom" | "center" | "right";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  position?: Position;
  size?: "sm" | "md" | "lg";
  showClose?: boolean;
  className?: string;
  children: ReactNode;
}

const POSITION_CLASSES: Record<Position, string> = {
  bottom: "inset-x-0 bottom-0 rounded-t-card",
  center: "inset-0 m-auto h-fit max-h-[90vh] rounded-card",
  right: "inset-y-0 right-0 rounded-l-card",
};

const SIZE_CLASSES: Record<Position, Record<"sm" | "md" | "lg", string>> = {
  bottom: {
    sm: "max-h-[60vh]",
    md: "max-h-[75vh]",
    lg: "max-h-[88vh]",
  },
  center: {
    sm: "w-[min(30rem,92vw)]",
    md: "w-[min(38rem,92vw)]",
    lg: "w-[min(52rem,94vw)]",
  },
  right: {
    sm: "w-[min(24rem,88vw)]",
    md: "w-[min(30rem,92vw)]",
    lg: "w-[min(38rem,94vw)]",
  },
};

export function Sheet({
  open,
  onClose,
  title,
  description,
  position = "bottom",
  size = "md",
  showClose = true,
  className,
  children,
}: SheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogProps = useDialog(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/35 animate-fade-in"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        {...dialogProps}
        className={cn(
          "absolute flex flex-col bg-warm-white shadow-float animate-toast-in",
          "focus-visible:outline-none",
          POSITION_CLASSES[position],
          SIZE_CLASSES[position][size],
          className
        )}
      >
        {(title || showClose) && (
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-hairline px-5 py-4">
            <div className="min-w-0">
              {title ? (
                <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="mt-0.5 text-sm text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            {showClose && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                autoFocus
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-soft-beige hover:text-ink"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            )}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </section>
    </div>
  );
}