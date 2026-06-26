"use client";

import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { recordOrderProofSent } from "@/lib/api/client";

interface WhatsAppProofButtonProps {
  href: string;
  orderNumber?: string;
  proofToken?: string;
}

type HandoffState = "idle" | "recording" | "recorded" | "error";

export function WhatsAppProofButton({
  href,
  orderNumber,
  proofToken,
}: WhatsAppProofButtonProps) {
  const [state, setState] = useState<HandoffState>("idle");
  const canTrack = Boolean(orderNumber && proofToken);

  function handleClick() {
    // The anchor still opens WhatsApp. We record the proof handoff in the
    // background so staff sees the order move to "under review". This never
    // confirms payment — that stays a manual admin action.
    if (!canTrack || state === "recording" || state === "recorded") {
      return;
    }

    setState("recording");
    recordOrderProofSent({
      orderNumber: orderNumber as string,
      token: proofToken as string,
    })
      .then(() => setState("recorded"))
      .catch(() => setState("error"));
  }

  return (
    <div className="grid gap-2">
      <a
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:bg-[var(--color-primary-hover)]"
        href={href}
        onClick={handleClick}
        rel="noreferrer"
        target="_blank"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Send proof on WhatsApp
      </a>
      {state === "recorded" ? (
        <p
          className="m-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-success)]"
          role="status"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Marked as proof sent. Staff will verify your payment shortly.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="m-0 text-sm text-[var(--color-text-muted)]" role="status">
          We could not update your order status automatically. Your WhatsApp
          message is what matters — staff will still verify your payment.
        </p>
      ) : null}
    </div>
  );
}
