"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      icon={<Printer className="h-4 w-4" aria-hidden="true" />}
      onClick={() => window.print()}
      variant="secondary"
    >
      Print invoice
    </Button>
  );
}
