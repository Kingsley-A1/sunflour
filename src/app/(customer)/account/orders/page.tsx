import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTime, formatNairaFromKobo } from "@/lib/formatters";
import { requireAuth } from "@/server/auth/rbac";
import { listCustomerOrders } from "@/server/modules/customers";

export const metadata = {
  title: "Order History",
};

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return (
      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
        <EmptyState
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
              href="/api/auth/signin"
            >
              Sign in
            </Link>
          }
          description="Sign in to view authenticated order history. Guest invoices use the tokenized invoice link from checkout."
          title="Sign in required"
        />
      </main>
    );
  }

  const { orders } = await listCustomerOrders({ page: 1, pageSize: 20 }, user);

  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Orders</p>
        <h1 className="m-0 mt-2 text-4xl font-extrabold">Order history</h1>
      </header>
      {orders.length === 0 ? (
        <EmptyState
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
              href="/menu"
            >
              Browse menu
            </Link>
          }
          description="Orders created while signed in will appear here."
          title="No orders yet"
        />
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <Link
              className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-surface-muted)]"
              href={`/account/orders/${order.orderNumber}`}
              key={order.orderNumber}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong>{order.orderNumber}</strong>
                <span>{formatNairaFromKobo(order.total)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill status={order.status} />
                <StatusPill status={order.paymentStatus} />
              </div>
              <p className="m-0 text-sm text-[var(--color-text-muted)]">
                {formatDateTime(order.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
