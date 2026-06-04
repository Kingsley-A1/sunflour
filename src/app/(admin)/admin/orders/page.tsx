import Link from "next/link";
import type { Route } from "next";
import { formatDateTime, formatNairaFromKobo } from "@/lib/formatters";
import { StatusPill } from "@/components/ui/status-pill";
import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { adminOrderListQuerySchema, listAdminOrders } from "@/server/modules/orders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Orders",
};

interface AdminOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildPageHref(
  input: {
    status?: string;
    paymentStatus?: string;
    orderNumber?: string;
    customerPhone?: string;
    pageSize: number;
  },
  page: number,
): Route {
  const searchParams = new URLSearchParams();

  if (input.status) {
    searchParams.set("status", input.status);
  }

  if (input.paymentStatus) {
    searchParams.set("paymentStatus", input.paymentStatus);
  }

  if (input.orderNumber) {
    searchParams.set("orderNumber", input.orderNumber);
  }

  if (input.customerPhone) {
    searchParams.set("customerPhone", input.customerPhone);
  }

  searchParams.set("page", String(page));
  searchParams.set("pageSize", String(input.pageSize));

  return `/admin/orders?${searchParams.toString()}` as Route;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  await requireRole(ADMIN_ROLES);
  const query = await searchParams;
  const input = adminOrderListQuerySchema.parse({
    status: first(query.status),
    paymentStatus: first(query.paymentStatus),
    orderNumber: first(query.orderNumber),
    customerPhone: first(query.customerPhone),
    page: first(query.page),
    pageSize: "25",
  });
  const { orders, pagination } = await listAdminOrders(input);
  const previousPage = Math.max(1, pagination.page - 1);
  const nextPage = Math.min(pagination.pageCount || 1, pagination.page + 1);

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Orders</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Order operations</h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Payment confirmation and lifecycle actions must use backend admin
          order APIs so audit logs and status events stay authoritative.
        </p>
      </header>
      <form className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-4" action="/admin/orders">
        <input className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" name="orderNumber" placeholder="Order number" defaultValue={input.orderNumber ?? ""} />
        <input className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" name="customerPhone" placeholder="Customer phone" defaultValue={input.customerPhone ?? ""} />
        <select className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" name="status" defaultValue={input.status ?? ""}>
          <option value="">All order statuses</option>
          {["PENDING_PAYMENT","PAYMENT_UNDER_REVIEW","PAYMENT_CONFIRMED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","REJECTED"].map((status) => (
            <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
          ))}
        </select>
        <button className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]" type="submit">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-[52rem] text-left text-sm">
          <thead className="bg-[var(--color-surface-soft)]">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr className="border-t border-[var(--color-border)]" key={order.orderNumber}>
                <td className="p-3 font-semibold">
                  <Link className="hover:underline" href={`/admin/orders/${order.orderNumber}`}>{order.orderNumber}</Link>
                </td>
                <td className="p-3">{order.customerNameSnapshot}</td>
                <td className="p-3">{formatNairaFromKobo(order.total)}</td>
                <td className="p-3"><StatusPill status={order.paymentStatus} /></td>
                <td className="p-3"><StatusPill status={order.status} /></td>
                <td className="p-3">{formatDateTime(order.createdAt)}</td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td className="p-3 text-[var(--color-text-muted)]" colSpan={6}>No orders match the filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <nav
        aria-label="Order pagination"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <p className="m-0 text-[var(--color-text-muted)]">
          Page {pagination.page} of {pagination.pageCount || 1}. Total orders: {pagination.total}.
        </p>
        <div className="flex gap-2">
          <Link
            aria-disabled={pagination.page <= 1}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={buildPageHref(input, previousPage)}
          >
            Previous
          </Link>
          <Link
            aria-disabled={pagination.page >= (pagination.pageCount || 1)}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={buildPageHref(input, nextPage)}
          >
            Next
          </Link>
        </div>
      </nav>
    </div>
  );
}
