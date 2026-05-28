import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTime, formatNairaFromKobo } from "@/lib/formatters";
import { requireRole } from "@/server/auth/rbac";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { getDashboardMetrics } from "@/server/modules/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  await requireRole(ADMIN_ROLES);
  const metrics = await getDashboardMetrics({});

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Dashboard</p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Operational dashboard</h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Backend metrics for {formatDateTime(metrics.range.from)} to{" "}
          {formatDateTime(metrics.range.to)} in {metrics.range.timeZone}.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard description="Orders created in the selected range." label="Today's orders" value={metrics.counts.ordersInRange} />
        <MetricCard description="Proof sent or under review." label="Pending payment" value={metrics.counts.pendingPaymentConfirmation} />
        <MetricCard description="Orders currently in preparation." label="Preparing" value={metrics.counts.preparingOrders} />
        <MetricCard description="Guest orders in the selected range." label="Guest orders" value={metrics.counts.guestOrdersInRange} />
        <MetricCard description="Orders currently out for delivery." label="Out for delivery" value={metrics.counts.outForDeliveryOrders} />
        <MetricCard description="Confirmed non-cancelled sales only." label={metrics.salesEstimate.label} value={formatNairaFromKobo(metrics.salesEstimate.total)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="grid gap-3 p-4">
          <h2 className="m-0 text-lg font-bold">Top ordered items</h2>
          {metrics.topOrderedItems.length === 0 ? (
            <p className="m-0 text-sm text-[var(--color-text-muted)]">No confirmed sales in range.</p>
          ) : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {metrics.topOrderedItems.map((item) => (
                <li className="text-sm" key={`${item.productName}:${item.variantName ?? ""}`}>
                  <strong>{item.productName}</strong>
                  {item.variantName ? `, ${item.variantName}` : ""} x {item.quantity}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="grid gap-3 p-4">
          <h2 className="m-0 text-lg font-bold">Unavailable products</h2>
          {metrics.unavailableProducts.length === 0 ? (
            <p className="m-0 text-sm text-[var(--color-text-muted)]">No hidden or out-of-stock products.</p>
          ) : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {metrics.unavailableProducts.map((product) => (
                <li className="flex items-center justify-between gap-3 text-sm" key={product.id}>
                  <span>{product.name}</span>
                  <StatusPill status={product.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="grid gap-3 p-4">
          <h2 className="m-0 text-lg font-bold">Pending reviews</h2>
          <p className="m-0 text-3xl font-extrabold">{metrics.counts.pendingReviews}</p>
          {metrics.recentPendingReviews.length === 0 ? (
            <p className="m-0 text-sm text-[var(--color-text-muted)]">No pending review queue.</p>
          ) : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {metrics.recentPendingReviews.map((review) => (
                <li className="text-sm" key={review.id}>
                  {review.customerNameSnapshot} rated {review.rating}/5
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
