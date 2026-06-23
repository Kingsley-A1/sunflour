"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CartItemRow } from "@/components/commerce/cart-item-row";
import { DeliveryQuoteSummary } from "@/components/commerce/delivery-quote-summary";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select } from "@/components/ui/select";
import { getDeliveryZones, quoteDelivery } from "@/lib/api/client";
import { useCart } from "@/features/cart/cart-store";
import type { DeliveryMethod, DeliveryQuote, DeliveryZone } from "@/types/domain";

export function CartPageClient() {
  const cart = useCart();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [method, setMethod] = useState<DeliveryMethod>("PICKUP");
  const [zoneId, setZoneId] = useState("");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeliveryZones()
      .then(setZones)
      .catch(() => setError("Delivery zones could not be loaded. Pickup remains available."));
  }, []);

  useEffect(() => {
    if (method === "DELIVERY" && !zoneId) {
      return;
    }

    quoteDelivery({
      deliveryMethod: method,
      deliveryZoneId: method === "DELIVERY" ? zoneId : undefined,
    })
      .then(setQuote)
      .catch(() =>
        setError("Delivery quote failed. Check the selected zone or choose pickup."),
      )
      .finally(() => setIsQuoteLoading(false));
  }, [method, zoneId]);

  const activeQuote = method === "DELIVERY" && !zoneId ? null : quote;

  if (cart.items.length === 0) {
    return (
      <EmptyState
        action={
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
            href="/menu"
          >
            Browse menu
          </Link>
        }
        description="Add menu items before choosing pickup or delivery."
        title="Your cart is empty"
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section className="grid gap-3" aria-label="Cart items">
        {cart.items.map((item) => {
          const itemKey = cart.getItemKey(item);

          return (
            <CartItemRow
              item={item}
              itemKey={itemKey}
              key={itemKey}
              onQuantityChange={(quantity) => cart.updateQuantity(itemKey, quantity)}
              onRemove={() => setPendingRemoveItem({ key: itemKey, name: item.name })}
            />
          );
        })}
      </section>
      <aside className="grid gap-4">
        <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="m-0 text-lg font-bold">Pickup or delivery</h2>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Choose fulfillment method</legend>
            {(["PICKUP", "DELIVERY"] as const).map((option) => (
              <label
                className="flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3"
                key={option}
              >
                <input
                  checked={method === option}
                  name="delivery-method"
                  onChange={() => {
                    setMethod(option);
                    setQuote(null);
                    setError(null);
                    setIsQuoteLoading(option === "PICKUP" || Boolean(zoneId));
                  }}
                  type="radio"
                />
                <span className="font-semibold">
                  {option === "PICKUP" ? "Pickup" : "Delivery"}
                </span>
              </label>
            ))}
          </fieldset>
          {method === "DELIVERY" ? (
            <Select
              label="Delivery zone"
              name="deliveryZone"
              onChange={(event) => {
                setZoneId(event.target.value);
                setQuote(null);
                setError(null);
                setIsQuoteLoading(Boolean(event.target.value));
              }}
              value={zoneId}
            >
              <option value="">Choose a zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </Select>
          ) : null}
        </section>
        {error ? <ErrorState description={error} title="Quote issue" /> : null}
        <DeliveryQuoteSummary
          loading={isQuoteLoading}
          quote={activeQuote}
          subtotal={cart.displaySubtotal}
        />
        <Link
          aria-disabled={method === "DELIVERY" && !activeQuote}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] aria-disabled:pointer-events-none aria-disabled:opacity-55"
          href="/checkout"
        >
          Continue to checkout
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </aside>
      <ConfirmDialog
        confirmLabel="Remove item"
        description={
          pendingRemoveItem
            ? `Remove ${pendingRemoveItem.name} from your cart.`
            : "Remove this item from your cart."
        }
        destructive
        onCancel={() => setPendingRemoveItem(null)}
        onConfirm={() => {
          if (pendingRemoveItem) {
            cart.removeItem(pendingRemoveItem.key);
          }

          setPendingRemoveItem(null);
        }}
        open={Boolean(pendingRemoveItem)}
        title="Remove item from cart?"
      />
    </div>
  );
}
