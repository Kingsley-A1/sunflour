import { notFound } from "next/navigation";
import { DownloadInvoiceButton } from "@/components/invoice/download-invoice-button";
import { PrintButton } from "@/components/invoice/print-button";
import { StatusPill } from "@/components/ui/status-pill";
import { getPublicInvoiceSafe } from "@/lib/api/server";
import { formatDateTime } from "@/lib/formatters";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function InvoicePage({
  params,
  searchParams,
}: InvoicePageProps) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  const { invoice } = await getPublicInvoiceSafe(orderNumber, query.token);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Invoice</p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold">{invoice.invoiceNumber}</h1>
          <p className="m-0 mt-2 text-sm text-[var(--color-text-muted)]">
            Generated {formatDateTime(invoice.generatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <StatusPill status={invoice.order.status} />
          <StatusPill status={invoice.order.paymentStatus} />
          <DownloadInvoiceButton
            html={invoice.htmlSnapshot}
            invoiceNumber={invoice.invoiceNumber}
          />
          <PrintButton />
        </div>
      </header>
      <iframe
        className="min-h-[36rem] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white sm:min-h-[52rem] lg:min-h-[72rem]"
        srcDoc={invoice.htmlSnapshot}
        title={`Invoice ${invoice.invoiceNumber}`}
      />
    </main>
  );
}
