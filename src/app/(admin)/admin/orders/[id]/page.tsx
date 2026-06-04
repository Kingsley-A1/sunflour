import { OrderActionsClient } from "@/components/admin/order-actions-client";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTime, formatNairaFromKobo } from "@/lib/formatters";
import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { getAdminOrderDetail } from "@/server/modules/orders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Order Detail",
};

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  await requireRole(ADMIN_ROLES);
  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Order detail</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">{order.orderNumber}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusPill status={order.status} />
          <StatusPill status={order.paymentStatus} />
        </div>
      </header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="grid gap-5">
          <Card className="grid gap-3 p-4">
            <h2 className="m-0 text-xl font-bold">Customer and fulfillment</h2>
            <dl className="grid gap-2 text-sm md:grid-cols-2">
              <div><dt className="font-semibold">Customer</dt><dd className="m-0 text-[var(--color-text-muted)]">{order.customerNameSnapshot} / {order.customerPhoneSnapshot}</dd></div>
              <div><dt className="font-semibold">Delivery</dt><dd className="m-0 text-[var(--color-text-muted)]">{order.deliveryMethod} {order.deliveryZoneNameSnapshot ?? ""}</dd></div>
              <div><dt className="font-semibold">Created</dt><dd className="m-0 text-[var(--color-text-muted)]">{formatDateTime(order.createdAt)}</dd></div>
              <div><dt className="font-semibold">Total</dt><dd className="m-0 text-[var(--color-text-muted)]">{formatNairaFromKobo(order.total)}</dd></div>
            </dl>
          </Card>
          <Card className="overflow-x-auto p-0">
            <table className="min-w-[36rem] text-left text-sm">
              <thead className="bg-[var(--color-surface-soft)]">
                <tr><th className="p-3">Item</th><th className="p-3">Qty</th><th className="p-3">Total</th></tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr className="border-t border-[var(--color-border)]" key={`${item.productNameSnapshot}:${item.variantNameSnapshot ?? ""}`}>
                    <td className="p-3 font-semibold">{item.productNameSnapshot}{item.variantNameSnapshot ? `, ${item.variantNameSnapshot}` : ""}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">{formatNairaFromKobo(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="grid gap-3 p-4">
            <h2 className="m-0 text-xl font-bold">Status timeline</h2>
            <ol className="m-0 grid list-none gap-3 p-0">
              {order.statusEvents.map((event) => (
                <li className="border-l-2 border-[var(--color-border)] pl-3 text-sm" key={event.id}>
                  <StatusPill status={event.toStatus} />
                  <p className="m-0 mt-1 text-[var(--color-text-muted)]">{formatDateTime(event.createdAt)} {event.reason ? `- ${event.reason}` : ""}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <OrderActionsClient
          adminNote={order.adminNote}
          currentPaymentStatus={order.paymentStatus}
          currentStatus={order.status}
          deliveryMethod={order.deliveryMethod}
          orderNumber={order.orderNumber}
        />
      </div>
    </div>
  );
}
