import { LoadingState } from "@/components/ui/loading-state";

export default function CustomerLoading() {
  return (
    <main className="mx-auto min-h-[60svh] max-w-5xl px-4 py-8">
      <LoadingState
        description="Loading account and order details."
        label="Loading account"
        variant="section"
      />
    </main>
  );
}
