import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "page" | "section" | "card" | "list";
  density?: "comfortable" | "compact";
  label?: string;
  title?: string;
  description?: string;
  skeletonCount?: number;
}

export function LoadingState({
  variant = "section",
  density = "comfortable",
  label = "Loading",
  title,
  description,
  skeletonCount,
}: LoadingStateProps) {
  const count =
    skeletonCount ??
    (variant === "page" ? 6 : variant === "card" ? 1 : variant === "list" ? 4 : 3);
  const compact = density === "compact";
  const statusText = title ?? label;

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "grid text-[var(--color-text)]",
        variant === "page"
          ? "min-h-[55svh] place-items-center py-8"
          : "gap-4",
      )}
      role="status"
    >
      <div
        className={cn(
          "grid w-full gap-4",
          variant === "page" ? "max-w-4xl" : null,
        )}
      >
        <div className="grid gap-1">
          <p className="m-0 text-sm font-bold text-[var(--color-text)]">
            {statusText}
          </p>
          {description ? (
            <p className="m-0 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {variant === "card" ? (
          <CardSkeleton compact={compact} />
        ) : variant === "list" ? (
          <ListSkeleton compact={compact} count={count} />
        ) : (
          <PageOrSectionSkeleton
            compact={compact}
            count={count}
            page={variant === "page"}
          />
        )}
      </div>
    </div>
  );
}

function PageOrSectionSkeleton({
  compact,
  count,
  page,
}: {
  compact: boolean;
  count: number;
  page: boolean;
}) {
  return (
    <div className="grid gap-3">
      <Skeleton className={cn(compact ? "h-8 max-w-sm" : "h-10 max-w-lg")} />
      <div
        className={cn(
          "grid gap-3",
          page ? "sm:grid-cols-2 lg:grid-cols-3" : null,
        )}
      >
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton
            className={cn(compact ? "h-14" : page ? "h-36" : "h-16")}
            key={`loading-block-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

function ListSkeleton({
  compact,
  count,
}: {
  compact: boolean;
  count: number;
}) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          key={`loading-row-${index}`}
        >
          <Skeleton className={cn(compact ? "h-10" : "h-12")} />
          <div className="grid content-center gap-2">
            <Skeleton className="h-3 max-w-[70%]" />
            <Skeleton className="h-3 max-w-[45%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <Skeleton className={cn(compact ? "h-24" : "h-36")} />
      <div className="mt-3 grid gap-2">
        <Skeleton className="h-4 max-w-[70%]" />
        <Skeleton className="h-4 max-w-[45%]" />
      </div>
    </div>
  );
}
