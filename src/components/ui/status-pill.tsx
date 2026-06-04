import { Badge } from "@/components/ui/badge";
import { getStatusMeta } from "@/lib/status";

interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const meta = getStatusMeta(status);

  return (
    <Badge
      aria-label={`${meta.label}: ${meta.helper}`}
      tone={meta.tone}
      title={meta.helper}
    >
      {meta.label}
    </Badge>
  );
}
