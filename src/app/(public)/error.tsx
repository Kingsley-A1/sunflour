"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto min-h-[70svh] max-w-6xl px-4 py-8">
      <ErrorState
        action={<Button onClick={reset}>Try again</Button>}
        description="Refresh this section or return to the menu if the problem continues."
      />
    </main>
  );
}
