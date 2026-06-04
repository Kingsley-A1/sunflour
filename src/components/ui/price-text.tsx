import { formatNairaFromKobo } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface PriceTextProps {
  amount: number;
  className?: string;
}

export function PriceText({ amount, className }: PriceTextProps) {
  return (
    <span className={cn("sf-price", className)}>
      {formatNairaFromKobo(amount)}
    </span>
  );
}
