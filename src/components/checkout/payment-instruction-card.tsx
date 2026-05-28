import Link from "next/link";
import type { Route } from "next";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PriceText } from "@/components/ui/price-text";
import { StatusPill } from "@/components/ui/status-pill";
import { WhatsAppProofButton } from "@/components/checkout/whatsapp-proof-button";
import type { CheckoutResult } from "@/types/domain";

function invoicePageUrl(result: CheckoutResult): string {
  try {
    const url = new URL(result.invoiceUrl, "http://sunflour.local");
    const token = url.searchParams.get("token");

    return token
      ? `/orders/${encodeURIComponent(result.orderNumber)}/invoice?token=${encodeURIComponent(token)}`
      : `/orders/${encodeURIComponent(result.orderNumber)}/invoice`;
  } catch {
    return `/orders/${encodeURIComponent(result.orderNumber)}/invoice`;
  }
}

export function PaymentInstructionCard({ result }: { result: CheckoutResult }) {
  return (
    <Card className="grid gap-5 border-[var(--color-success)] p-5">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={result.paymentStatus} />
          <StatusPill status={result.status} />
        </div>
        <h2 className="m-0 text-2xl font-extrabold">Order created</h2>
        <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
          Order {result.orderNumber} is waiting for manual Moniepoint transfer
          verification. Payment is not confirmed until Sunflour staff verifies it.
        </p>
      </div>
      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-soft)] p-4">
        <p className="m-0 text-sm text-[var(--color-text-muted)]">Amount to transfer</p>
        <PriceText amount={result.total} className="text-3xl" />
      </div>
      <section className="grid gap-2">
        <h3 className="m-0 text-base font-bold">Bank transfer instruction</h3>
        <p className="m-0 whitespace-pre-line text-sm leading-6 text-[var(--color-text)]">
          {result.paymentInstruction}
        </p>
      </section>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold"
          href={invoicePageUrl(result) as Route}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          View invoice
        </Link>
        <WhatsAppProofButton href={result.whatsAppProofUrl} />
      </div>
    </Card>
  );
}
