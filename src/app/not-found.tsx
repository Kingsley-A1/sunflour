import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-[var(--color-canvas)] p-4">
      <div className="w-full max-w-lg">
        <EmptyState
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
              href="/menu"
            >
              Go to menu
            </Link>
          }
          description="The page may have moved, or the record may not be available."
          title="Page not found"
        />
      </div>
    </main>
  );
}
