import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-4">
      <p className="m-0 text-sm font-medium text-[var(--color-text-muted)]">
        {label}
      </p>
      <div className="grid gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
}
