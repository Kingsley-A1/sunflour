"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useIsOnline } from "@/lib/hooks/use-network-status";

export default function AdminError({ reset }: { reset: () => void }) {
  const isOffline = !useIsOnline();

  return (
    <ErrorState
      action={<Button onClick={reset}>Retry</Button>}
      description={
        isOffline
          ? "You appear to be offline. Reconnect to the internet, then retry. Unsaved admin changes may need to be re-entered."
          : "The admin request failed. Retry, then check your admin session if it continues."
      }
      title={isOffline ? "No internet connection" : "Admin page failed to load"}
    />
  );
}
