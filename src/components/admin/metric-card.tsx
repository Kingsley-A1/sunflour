import { Card } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
}

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <Card className="grid gap-2 p-4">
      <p className="m-0 text-sm font-semibold text-[var(--color-text-muted)]">{label}</p>
      <p className="m-0 text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">
        {description}
      </p>
    </Card>
  );
}
