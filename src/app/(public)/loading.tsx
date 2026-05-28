import { LoadingState } from "@/components/ui/loading-state";

export default function PublicLoading() {
  return (
    <main className="mx-auto min-h-[70svh] max-w-6xl px-4 py-8">
      <LoadingState label="Loading Sunflour" />
    </main>
  );
}
