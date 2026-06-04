import { LoadingState } from "@/components/ui/loading-state";

export default function MenuLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <LoadingState
        description="Loading product categories and menu cards."
        label="Loading menu"
        skeletonCount={8}
        variant="page"
      />
    </main>
  );
}
