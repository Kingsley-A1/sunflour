import { LoadingState } from "@/components/ui/loading-state";

export default function AdminLoading() {
  return (
    <LoadingState
      description="Loading operational controls and backend state."
      label="Loading admin workspace"
      skeletonCount={5}
      variant="page"
    />
  );
}
