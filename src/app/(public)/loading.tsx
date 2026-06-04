import { LoadingState } from "@/components/ui/loading-state";

export default function PublicLoading() {
  return (
    <main className="mx-auto min-h-[70svh] max-w-6xl px-4 py-8">
      <LoadingState
        description="Preparing the bakery page and keeping the layout stable."
        label="Loading Sunflour"
        variant="page"
      />
    </main>
  );
}
