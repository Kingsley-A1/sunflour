"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      action={<Button onClick={reset}>Retry</Button>}
      description="The admin request failed. Retry, then check your admin session if it continues."
      title="Admin page failed to load"
    />
  );
}
