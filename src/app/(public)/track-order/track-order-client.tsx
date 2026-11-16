"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { apiRequest, getApiErrorMessage } from "@/lib/api/client";
import { formatDateTime, formatNairaFromKobo } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { DeliveryMethod, OrderStatus, PaymentStatus } from "@/types/domain";

interface TrackedOrder {
  orderNumber: string;
  deliveryMethod: DeliveryMethod;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryTotalFeeSnapshot: number;
  createdAt: string;
  invoiceUrl: string | null;
  items: Array<{
    productNameSnapshot: string;
    variantNameSnapshot: string | null;
    quantity: number;
    lineTotal: number;
  }>;
  statusEvents: Array<{ id: string; toStatus: OrderStatus; createdAt: string }>;
}

interface Step {
  label: string;
  statuses: OrderStatus[];
}

function stepsFor(method: DeliveryMethod): Step[] {
  return [
    { label: "Order placed", statuses: ["PENDING_PAYMENT", "PAYMENT_UNDER_REVIEW"] },
    { label: "Payment confirmed", statuses: ["PAYMENT_CONFIRMED"] },
    { label: "Preparing", statuses: ["PREPARING"] },
    method === "DELIVERY"
      ? { label: "Out for delivery", statuses: ["OUT_FOR_DELIVERY"] }
      : { label: "Ready for pickup", statuses: ["READY_FOR_PICKUP"] },
    { label: method === "DELIVERY" ? "Delivered" : "Collected", statuses: ["DELIVERED"] },
  ];
}

function invoicePath(order: TrackedOrder): string | null {
  if (!order.invoiceUrl) {
    return null;
  }

  const token = new URL(order.invoiceUrl, "http://sunflour.local").searchParams.get("token");
  return token
    ? `/orders/${encodeURIComponent(order.orderNumber)}/invoice?token=${encodeURIComponent(token)}`
    : null;
}

export function TrackOrderClient({ initialOrderNumber }: { initialOrderNumber: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!orderNumber.trim() || !phone.trim()) {
      setError("Enter your order number and the phone number used at checkout.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest<{ order: TrackedOrder }>("/api/v1/public/orders/lookup", {
        method: "POST",
        body: JSON.stringify({ orderNumber: orderNumber.trim().toUpperCase(), phone: phone.trim() }),
      });
      setOrder(data.order);
    } catch (lookupError) {
      setOrder(null);
      const message = getApiErrorMessage(lookupError, "We could not find that order.");
      setError(
        message.includes("could not be found") || message.includes("not found")
          ? "No order matches that number and phone. Check both and try again."
          : message,
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-4 p-4">
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          Your order number is on your invoice and confirmation, e.g. SFB-20261116-ABC123.
        </p>
        <form className="grid gap-4" noValidate onSubmit={lookup}>
          <Input
            autoCapitalize="characters"
            autoComplete="off"
            label="Order number"
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="SFB-…"
            value={orderNumber}
          />
          <Input
            autoComplete="tel"
            inputMode="tel"
            label="Phone number used at checkout"
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            value={phone}
          />
          {error ? (
            <p className="m-0 text-sm font-semibold text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            icon={<Search className="h-4 w-4" aria-hidden="true" />}
            loading={isLoading}
            type="submit"
          >
            Track order
          </Button>
        </form>
      </Card>

      {order ? <TrackedOrderView order={order} /> : null}
    </div>
  );
}

function TrackedOrderView({ order }: { order: TrackedOrder }) {
  const isStopped = order.status === "CANCELLED" || order.status === "REJECTED";
  const steps = stepsFor(order.deliveryMethod);
  const currentIndex = steps.findIndex((step) => step.statuses.includes(order.status));
  const reachedAt = (step: Step) =>
    order.statusEvents.find((event) => step.statuses.includes(event.toStatus))?.createdAt;
  const invoiceHref = invoicePath(order);

  return (
    <section aria-live="polite" className="grid gap-4">
      <Card className="grid gap-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-xl font-extrabold">{order.orderNumber}</h2>
            <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
              Placed {formatDateTime(order.createdAt)} ·{" "}
              {order.deliveryMethod === "DELIVERY" ? "Delivery" : "Pickup"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={order.status} />
            <StatusPill status={order.paymentStatus} />
          </div>
        </div>

        {isStopped ? (
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger-text)]">
            This order was {order.status === "CANCELLED" ? "cancelled" : "rejected"}. Contact
            Sunflour if you have questions.
          </p>
        ) : (
          <ol className="m-0 grid list-none gap-0 p-0">
            {steps.map((step, index) => {
              const done = index < currentIndex;
              const current = index === currentIndex;
              const at = reachedAt(step);

              return (
                <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3" key={step.label}>
                  <span className="grid justify-items-center">
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold",
                        done && "border-[var(--color-success)] bg-[var(--color-success)] text-[var(--color-text-inverse)]",
                        current && "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]",
                        !done && !current && "border-[var(--color-border-strong)] text-[var(--color-text-soft)]",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                    </span>
                    {index < steps.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "w-0.5 flex-1 min-h-5",
                          done ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]",
                        )}
                      />
                    ) : null}
                  </span>
                  <span className="pb-4">
                    <span
                      className={cn(
                        "block text-sm font-bold",
                        !done && !current && "text-[var(--color-text-muted)]",
                      )}
                    >
                      {step.label}
                      {current ? <span className="sr-only"> (current step)</span> : null}
                    </span>
                    {at && (done || current) ? (
                      <span className="block text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(at)}
                      </span>
                    ) : null}
                    {current && order.status === "PENDING_PAYMENT" ? (
                      <span className="block text-xs text-[var(--color-text-muted)]">
                        Waiting for your transfer proof on WhatsApp.
                      </span>
                    ) : null}
                    {current && order.status === "PAYMENT_UNDER_REVIEW" ? (
                      <span className="block text-xs text-[var(--color-text-muted)]">
                        Staff are checking your transfer.
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card className="grid gap-3 p-4">
        <h3 className="m-0 text-lg font-bold">Items</h3>
        <ul className="m-0 grid list-none gap-2 p-0">
          {order.items.map((item, index) => (
            <li className="flex justify-between gap-4 text-sm" key={`${item.productNameSnapshot}-${index}`}>
              <span>
                {item.productNameSnapshot}
                {item.variantNameSnapshot ? ` (${item.variantNameSnapshot})` : ""} × {item.quantity}
              </span>
              <span className="tabular-nums">{formatNairaFromKobo(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-[var(--color-border)] pt-3 font-bold">
          <span>Items total</span>
          <span className="tabular-nums">{formatNairaFromKobo(order.subtotal)}</span>
        </div>
        {order.deliveryTotalFeeSnapshot > 0 ? (
          <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
            <span>Delivery fee (paid to the rider)</span>
            <span className="tabular-nums">{formatNairaFromKobo(order.deliveryTotalFeeSnapshot)}</span>
          </div>
        ) : null}
        {invoiceHref ? (
          <Link
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold hover:bg-[var(--color-surface-muted)]"
            href={invoiceHref as Route}
          >
            View invoice
          </Link>
        ) : null}
      </Card>
    </section>
  );
}
