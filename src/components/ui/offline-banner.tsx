"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useIsOnline } from "@/lib/hooks/use-network-status";

/**
 * App-wide network status banner. It surfaces a clear offline state and a
 * retry path so weak or lost connections do not strand customers on a silent
 * failure. It renders nothing while online.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();

  if (isOnline) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-x-0 top-0 z-[var(--layer-toast)] flex justify-center px-3 pt-3"
      role="status"
    >
      <div className="flex w-full max-w-2xl flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-3 text-sm shadow-[var(--shadow-floating)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <WifiOff
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]"
            aria-hidden="true"
          />
          <div>
            <p className="m-0 font-bold text-[var(--color-text)]">
              You are offline
            </p>
            <p className="m-0 text-[var(--color-text-muted)]">
              Some actions will not work until your connection returns. Your
              cart and form entries are kept.
            </p>
          </div>
        </div>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
          onClick={() => window.location.reload()}
          type="button"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry now
        </button>
      </div>
    </div>
  );
}
