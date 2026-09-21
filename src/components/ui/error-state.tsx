import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this page. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center" role="alert">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="max-w-sm text-sm text-muted">{description}</p>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}