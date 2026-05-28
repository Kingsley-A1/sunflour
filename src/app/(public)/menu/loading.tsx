import { LoadingState } from "@/components/ui/loading-state";

export default function MenuLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <LoadingState label="Loading menu" />
    </main>
  );
}
