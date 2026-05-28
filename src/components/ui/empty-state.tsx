import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="grid gap-4 p-5 text-center">
      <div className="grid gap-2">
        <h2 className="m-0 text-xl font-bold text-[var(--color-text)]">{title}</h2>
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          {description}
        </p>
      </div>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </Card>
  );
}
