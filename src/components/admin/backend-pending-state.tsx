import { ErrorState } from "@/components/ui/error-state";

interface BackendPendingStateProps {
  title: string;
  description: string;
}

export function BackendPendingState({
  title,
  description,
}: BackendPendingStateProps) {
  return (
    <ErrorState
      description={`${description} This UI is intentionally not guessing data or mutating local-only state.`}
      title={title}
    />
  );
}
