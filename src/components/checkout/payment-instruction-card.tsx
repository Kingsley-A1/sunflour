"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { ArrowRight, Check, CircleCheck, Copy, FileText, Home, Landmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PriceText } from "@/components/ui/price-text";
import { StatusPill } from "@/components/ui/status-pill";
import { useToast } from "@/components/ui/toast";
import { WhatsAppProofButton } from "@/components/checkout/whatsapp-proof-button";
import { CancelOrderWindow } from "@/components/checkout/cancel-order-window";
import type { CheckoutResult } from "@/types/domain";

interface ParsedPaymentInstruction {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  note: string;
}

function parsePaymentInstruction(raw: string): ParsedPaymentInstruction {
  const bankName = /Bank Name:\s*(.+)/i.exec(raw)?.[1]?.trim() ?? null;
  const accountName = /Account Name:\s*(.+)/i.exec(raw)?.[1]?.trim() ?? null;
  const accountNumber = /Account Number:\s*(.+)/i.exec(raw)?.[1]?.trim() ?? null;
  const note = raw
    .split("\n")
    .filter(
      (line) =>
        !/^(Bank Name|Account Name|Account Number):/i.test(line.trim()),
    )
    .join("\n")
    .trim();

  return { bankName, accountName, accountNumber, note };
}

function invoiceAccessToken(result: CheckoutResult): string | undefined {
  try {
    const url = new URL(result.invoiceUrl, "http://sunflour.local");

    return url.searchParams.get("token") ?? undefined;
  } catch {
    return undefined;
  }
}

// The proof WhatsApp URL already encodes the business number as `wa.me/<digits>`.
// Reuse it so the cancellation notice reaches the same inbox without threading a
// separate number through the checkout response.
function proofWhatsAppNumber(result: CheckoutResult): string | null {
  const match = /wa\.me\/(\d+)/.exec(result.whatsAppProofUrl);

  return match?.[1] ?? null;
}

function invoicePageUrl(result: CheckoutResult): string {
  const token = invoiceAccessToken(result);

  return token
    ? `/orders/${encodeURIComponent(result.orderNumber)}/invoice?token=${encodeURIComponent(token)}`
    : `/orders/${encodeURIComponent(result.orderNumber)}/invoice`;
}

export function PaymentInstructionCard({
  result,
  placedAt,
}: {
  result: CheckoutResult;
  placedAt: number;
}) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);
  const instruction = parsePaymentInstruction(result.paymentInstruction);

  async function copyAccountNumber() {
    if (!instruction.accountNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(instruction.accountNumber);
      setCopied(true);
      notify("Account number copied.", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Could not copy. Copy the account number manually.", "error");
    }
  }

  return (
    <Card className="grid gap-5 p-5">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--color-success-soft)]">
            <CircleCheck
              className="h-6 w-6 text-[var(--color-success)]"
              aria-hidden="true"
            />
          </span>
          <StatusPill status={result.status} />
        </div>
        <h2 className="m-0 text-2xl font-extrabold">Order received!</h2>
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          Thanks for your order. Complete the transfer below and send your proof
          on WhatsApp so we can confirm your payment and start packaging your
          order.
        </p>
      </div>
      <CancelOrderWindow
        orderNumber={result.orderNumber}
        orderStatus={result.status}
        placedAt={placedAt}
        whatsAppNumber={proofWhatsAppNumber(result)}
      />
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <p className="m-0 text-sm font-semibold text-[var(--color-text-muted)]">
          Amount to transfer now
        </p>
        <PriceText amount={result.subtotal} className="text-3xl" />
      </div>
      {result.delivery.totalFee > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
          <p className="m-0 text-sm font-semibold text-[var(--color-text-muted)]">
            Pay on delivery (cash to delivery person)
          </p>
          <PriceText amount={result.delivery.totalFee} className="text-xl" />
        </div>
      ) : null}
      <section className="grid gap-3 rounded-[var(--radius-md)] border-2 border-[var(--color-primary)] bg-[var(--color-accent-soft)] p-4">
        <h3 className="m-0 flex items-center gap-2 text-base font-bold">
          <Landmark className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          Bank transfer instruction
        </h3>
        {instruction.bankName || instruction.accountName ? (
          <dl className="m-0 grid gap-1.5 text-sm">
            {instruction.bankName ? (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-semibold text-[var(--color-text-muted)]">Bank</dt>
                <dd className="m-0 font-bold text-[var(--color-text)]">{instruction.bankName}</dd>
              </div>
            ) : null}
            {instruction.accountName ? (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-semibold text-[var(--color-text-muted)]">Account name</dt>
                <dd className="m-0 break-words text-right font-bold text-[var(--color-text)]">
                  {instruction.accountName}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        {instruction.accountNumber ? (
          <div className="grid gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-primary)] bg-[var(--color-surface)] p-3">
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
              Account number
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl font-extrabold tracking-wider text-[var(--color-text)] [font-variant-numeric:tabular-nums]">
                {instruction.accountNumber}
              </span>
              <button
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                onClick={copyAccountNumber}
                type="button"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : null}
        {instruction.note ? (
          <p className="m-0 whitespace-pre-line break-words text-sm leading-6 text-[var(--color-text)] [overflow-wrap:anywhere]">
            {instruction.note}
          </p>
        ) : null}
      </section>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold"
          href={invoicePageUrl(result) as Route}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          View invoice
        </Link>
        <WhatsAppProofButton
          href={result.whatsAppProofUrl}
          orderNumber={result.orderNumber}
          proofToken={invoiceAccessToken(result)}
        />
      </div>
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row">
        <Link
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          href={"/menu" as Route}
        >
          Browse menu
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold hover:bg-[var(--color-surface-muted)]"
          href={"/" as Route}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </div>
    </Card>
  );
}
