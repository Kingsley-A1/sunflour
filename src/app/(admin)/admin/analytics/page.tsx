import {
  AnalyticsRangeTabs,
  AnalyticsReportView,
} from "@/components/admin/analytics-report-view";
import { ErrorState } from "@/components/ui/error-state";
import { formatDateTime } from "@/lib/formatters";
import { requireRole } from "@/server/auth/rbac";
import { ANALYTICS_ROLES } from "@/server/auth/roles";
import {
  ANALYTICS_RANGES,
  getAnalyticsReport,
  type AnalyticsRangeKey,
  type AnalyticsReportResponse,
} from "@/server/modules/analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics",
};

function parseRange(value: string | string[] | undefined): AnalyticsRangeKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return (ANALYTICS_RANGES as readonly string[]).includes(raw ?? "")
    ? (raw as AnalyticsRangeKey)
    : "7d";
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(ANALYTICS_ROLES);
  const range = parseRange((await searchParams).range);

  let report: AnalyticsReportResponse | null = null;
  let error: string | null = null;
  try {
    report = await getAnalyticsReport({ range });
  } catch {
    error =
      "Analytics could not be loaded. If this is a new deployment, run the database migration and try again.";
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">Analytics</p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold">How customers use the site</h1>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            {report
              ? `${report.range.label}: ${formatDateTime(report.range.from)} to ${formatDateTime(report.range.to)}, compared with the period before.`
              : "Visitors, the steps they take, and where they stop."}
          </p>
        </div>
        <AnalyticsRangeTabs active={range} />
      </header>
      {error || !report ? (
        <ErrorState description={error ?? "No data."} title="Analytics unavailable" />
      ) : (
        <AnalyticsReportView report={report} />
      )}
    </div>
  );
}
