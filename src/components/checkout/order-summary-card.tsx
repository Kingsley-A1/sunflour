import { Card } from "@/components/ui/card";
import { PriceText } from "@/components/ui/price-text";
import type { CartItem } from "@/features/cart/cart-store";
import type { DeliveryQuote } from "@/types/domain";

interface OrderSummaryCardProps {
  items: CartItem[];
  subtotal: number;
  quote: DeliveryQuote | null;
}

export function OrderSummaryCard({ items, subtotal, quote }: OrderSummaryCardProps) {
  const total = subtotal + (quote?.totalFee ?? 0);

  return (
    <Card className="grid gap-4 p-4">
      <h2 className="m-0 text-lg font-bold">Review order</h2>
      <ul className="m-0 grid list-none gap-3 p-0">
        {items.map((item) => (
          <li className="flex justify-between gap-4 text-sm" key={`${item.productId}:${item.variantId ?? "base"}`}>
            <span>
              <strong>{item.name}</strong>
              {item.variantName ? `, ${item.variantName}` : ""} x {item.quantity}
            </span>
            <PriceText amount={item.unitPrice * item.quantity} />
          </li>
        ))}
      </ul>
      <dl className="m-0 grid gap-2 border-t border-[var(--color-border)] pt-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-text-muted)]">Subtotal</dt>
          <dd className="m-0">
            <PriceText amount={subtotal} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-text-muted)]">Delivery base fee</dt>
          <dd className="m-0">
            <PriceText amount={quote?.baseFee ?? 0} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-text-muted)]">6 PM surcharge</dt>
          <dd className="m-0">
            <PriceText amount={quote?.surcharge ?? 0} />
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-[var(--color-border)] pt-3 text-base font-bold">
          <dt>Display estimate</dt>
          <dd className="m-0">
            <PriceText amount={total} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}
