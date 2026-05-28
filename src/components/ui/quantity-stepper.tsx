"use client";

import { Minus, Plus } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  label = "Quantity",
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center gap-2" aria-label={label}>
      <IconButton
        disabled={value <= min}
        icon={<Minus className="h-4 w-4" aria-hidden="true" />}
        label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
      />
      <span className="grid h-11 min-w-12 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-bold tabular-nums">
        {value}
      </span>
      <IconButton
        disabled={value >= max}
        icon={<Plus className="h-4 w-4" aria-hidden="true" />}
        label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
      />
    </div>
  );
}
