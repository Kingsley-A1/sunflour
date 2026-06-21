import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type FormStatusTone = "danger" | "info" | "success";

interface FormStatusMessageProps {
  message: string;
  tone: FormStatusTone;
  className?: string;
}

const toneClasses: Record<FormStatusTone, string> = {
  danger:
    "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger-text)]",
  info: "border-[var(--color-info)] bg-[var(--color-info-soft)] text-[var(--color-info-text)]",
  success:
    "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success-text)]",
};

const toneIcons = {
  danger: AlertCircle,
  info: Info,
  success: CheckCircle2,
} satisfies Record<FormStatusTone, typeof AlertCircle>;

export function FormStatusMessage({
  message,
  tone,
  className,
}: FormStatusMessageProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      aria-atomic="true"
      aria-live={tone === "danger" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-sm)] border p-3 text-sm font-semibold",
        toneClasses[tone],
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="m-0">{message}</p>
    </div>
  );
}
