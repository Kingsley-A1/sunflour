"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useIsOnline } from "@/lib/hooks/use-network-status";

export default function PublicError({ reset }: { reset: () => void }) {
  const isOffline = !useIsOnline();

  return (
    <main className="mx-auto min-h-[70svh] max-w-6xl px-4 py-8">
      <ErrorState
        action={<Button onClick={reset}>Try again</Button>}
        description={
          isOffline
            ? "You appear to be offline. Check your internet connection, then tap Try again. Your cart is saved on this device."
            : "Refresh this section or return to the menu if the problem continues."
        }
        title={isOffline ? "No internet connection" : undefined}
      />
    </main>
  );
}
