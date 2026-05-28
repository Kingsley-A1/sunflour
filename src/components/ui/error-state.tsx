import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
}

export function ErrorState({
  title = "Something needs attention",
  description,
  action,
}: ErrorStateProps) {
  return (
    <Card className="grid gap-4 border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
        <div className="grid gap-1">
          <h2 className="m-0 text-lg font-bold text-[var(--color-text)]">{title}</h2>
          <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </Card>
  );
}
