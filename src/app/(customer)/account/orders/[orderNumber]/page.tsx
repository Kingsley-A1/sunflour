import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTime, formatNairaFromKobo } from "@/lib/formatters";
import { requireAuth } from "@/server/auth/rbac";
import { getCustomerOrderDetail } from "@/server/modules/customers";

export const metadata = {
  title: "Order Detail",
};

export const dynamic = "force-dynamic";

interface AccountOrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    notFound();
  }

  const { orderNumber } = await params;
  const order = await getCustomerOrderDetail(orderNumber, user).catch(() => null);

  if (!order) {
    notFound();
  }

  let invoiceHref: string | null = null;
  if (order.invoiceUrl) {
    const url = new URL(order.invoiceUrl, "http://sunflour.local");
    const token = url.searchParams.get("token");
    invoiceHref = token
      ? `/orders/${encodeURIComponent(order.orderNumber)}/invoice?token=${encodeURIComponent(token)}`
      : null;
  }

  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Order</p>
        <h1 className="m-0 mt-2 text-4xl font-extrabold">{order.orderNumber}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusPill status={order.status} />
          <StatusPill status={order.paymentStatus} />
        </div>
      </header>
      <Card className="grid gap-3 p-4">
        <h2 className="m-0 text-xl font-bold">Order summary</h2>
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          Created {formatDateTime(order.createdAt)}
        </p>
        <ul className="m-0 grid list-none gap-2 p-0">
          {order.items.map((item) => (
            <li className="flex justify-between gap-4 text-sm" key={`${item.productNameSnapshot}:${item.variantNameSnapshot ?? ""}`}>
              <span>{item.productNameSnapshot}{item.variantNameSnapshot ? `, ${item.variantNameSnapshot}` : ""} x {item.quantity}</span>
              <span>{formatNairaFromKobo(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-[var(--color-border)] pt-3 font-bold">
          <span>Total</span>
          <span>{formatNairaFromKobo(order.total)}</span>
        </div>
      </Card>
      {invoiceHref ? (
        <Link
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
          href={invoiceHref as Route}
        >
          View invoice
        </Link>
      ) : null}
    </main>
  );
}
