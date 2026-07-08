import { Card } from "@/components/ui/card";
import { PriceText } from "@/components/ui/price-text";
import type { DeliveryQuote } from "@/types/domain";

interface DeliveryQuoteSummaryProps {
  quote: DeliveryQuote | null;
  subtotal: number;
  loading?: boolean;
}

export function DeliveryQuoteSummary({
  quote,
  subtotal,
  loading = false,
}: DeliveryQuoteSummaryProps) {
  const deliveryFeeDueOnDelivery = quote?.totalFee ?? 0;

  return (
    <Card className="grid gap-3 p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="m-0 text-lg font-bold">Order estimate</h2>
        {loading ? (
          <span className="text-sm text-[var(--color-text-muted)]">Updating...</span>
        ) : null}
      </div>
      <dl className="grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--color-text-muted)]">Items subtotal</dt>
          <dd className="m-0">
            <PriceText amount={subtotal} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--color-text-muted)]">Delivery base fee</dt>
          <dd className="m-0">
            <PriceText amount={quote?.baseFee ?? 0} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--color-text-muted)]">6 PM surcharge</dt>
          <dd className="m-0">
            <PriceText amount={quote?.surcharge ?? 0} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-3 text-base">
          <dt className="font-bold">Pay now (bank transfer)</dt>
          <dd className="m-0">
            <PriceText amount={subtotal} className="text-xl" />
          </dd>
        </div>
        {deliveryFeeDueOnDelivery > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[var(--color-text-muted)]">
              Pay on delivery (cash to delivery person)
            </dt>
            <dd className="m-0">
              <PriceText amount={deliveryFeeDueOnDelivery} />
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">
        This is a display estimate. Sunflour recalculates product prices,
        delivery fee, surcharge, and total on the server when the order is
        created. Only the product amount is paid by bank transfer; the
        delivery fee is paid in cash to the delivery person on delivery.
      </p>
    </Card>
  );
}
