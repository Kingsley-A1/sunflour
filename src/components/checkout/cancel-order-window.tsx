"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Undo2, X } from "lucide-react";

interface CancelOrderWindowProps {
  orderNumber: string;
  // Digits-only WhatsApp number to receive the cancellation notice. When null,
  // the message opens WhatsApp without a preset recipient.
  whatsAppNumber: string | null;
  // Epoch ms when the order was placed. The quick-cancel affordance is only
  // offered for a short window after this moment.
  placedAt: number;
}

// Customers get a brief grace period to reverse an order they placed by
// mistake. This is a client-side convenience only: it never mutates order state
// itself — it hands the customer a pre-filled WhatsApp cancellation notice so
// staff can act on it, matching the manual-payment operating model.
const CANCEL_WINDOW_MS = 10_000;

type Phase = "counting" | "reason" | "closed";

function buildCancelWhatsAppUrl(
  orderNumber: string,
  reason: string,
  whatsAppNumber: string | null,
): string {
  const message = [
    "Hello Sunflour Bakery, I want to CANCEL my order.",
    "",
    `Order Number: ${orderNumber}`,
    `Reason: ${reason.trim()}`,
    "",
    "Please cancel this order for me. Thank you.",
  ].join("\n");

  const digits = whatsAppNumber?.replace(/\D/g, "");
  const baseUrl = digits ? `https://wa.me/${digits}` : "https://wa.me/";

  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

export function CancelOrderWindow({
  orderNumber,
  whatsAppNumber,
  placedAt,
}: CancelOrderWindowProps) {
  const [now, setNow] = useState(() => Date.now());
  const [phase, setPhase] = useState<Phase>("counting");
  const [reason, setReason] = useState("");

  const secondsLeft = Math.max(
    0,
    Math.ceil((placedAt + CANCEL_WINDOW_MS - now) / 1000),
  );

  // Tick once a second while the window counts down. Once the customer opens
  // the reason form we stop caring about the clock — they keep the ability to
  // send the notice for as long as this screen is open.
  useEffect(() => {
    if (phase !== "counting") {
      return;
    }

    if (secondsLeft <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("closed");
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase, secondsLeft]);

  const cancelHref = useMemo(
    () => buildCancelWhatsAppUrl(orderNumber, reason, whatsAppNumber),
    [orderNumber, reason, whatsAppNumber],
  );

  const reasonReady = reason.trim().length >= 3;

  if (phase === "closed") {
    return null;
  }

  if (phase === "counting") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          Placed by mistake? You can cancel for the next{" "}
          <span
            aria-hidden="true"
            className="font-bold text-[var(--color-text)] [font-variant-numeric:tabular-nums]"
          >
            {secondsLeft}s
          </span>
          .
        </p>
        <button
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-danger)] px-3 text-sm font-semibold text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          onClick={() => setPhase("reason")}
          type="button"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          Cancel this order
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-bold text-[var(--color-danger)]">
            Cancel order {orderNumber}
          </h3>
          <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
            Tell us briefly why, then send the cancellation to us on WhatsApp.
          </p>
        </div>
        <button
          aria-label="Keep my order"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-pill)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          onClick={() => setPhase("closed")}
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-[var(--color-text)]">
          Reason for cancellation
        </span>
        <textarea
          className="min-h-20 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          maxLength={300}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. I ordered the wrong item"
          value={reason}
        />
      </label>
      {reasonReady ? (
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-danger)] px-4 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:brightness-95"
          href={cancelHref}
          onClick={() => setPhase("closed")}
          rel="noreferrer"
          target="_blank"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Send cancellation on WhatsApp
        </a>
      ) : (
        <button
          aria-disabled="true"
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-danger)] px-4 text-sm font-semibold text-[var(--color-text-inverse)] opacity-55"
          disabled
          type="button"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Send cancellation on WhatsApp
        </button>
      )}
    </div>
  );
}
