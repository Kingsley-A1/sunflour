import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Info,
  Lightbulb,
} from "lucide-react";
import { formatNairaFromKobo } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  AnalyticsRangeKey,
  AnalyticsReportResponse,
} from "@/server/modules/analytics";

/**
 * Read-only rendering of the analytics report. Every number has a sentence
 * next to it: the page is written for a bakery owner, not an analyst.
 */

const RANGE_OPTIONS: Array<{ key: AnalyticsRangeKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-NG").format(value);
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return "—";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function formatDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid min-w-0 content-start gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-raised)]",
        className,
      )}
    >
      <div>
        <h2 className="m-0 text-lg font-extrabold">{title}</h2>
        {description ? (
          <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-text-muted)]">
      {children}
    </p>
  );
}

function Change({
  current,
  previous,
  mode = "relative",
  compareLabel,
}: {
  current: number;
  previous: number;
  mode?: "relative" | "points";
  compareLabel: string;
}) {
  if (previous === 0 && current === 0) {
    return <span className="text-[var(--color-text-soft)]">No change</span>;
  }
  if (mode === "relative" && previous === 0) {
    return <span className="text-[var(--color-text-soft)]">New activity</span>;
  }
  const delta =
    mode === "points"
      ? Math.round((current - previous) * 100)
      : Math.round(((current - previous) / previous) * 100);
  if (delta === 0) {
    return <span className="text-[var(--color-text-soft)]">Same as {compareLabel}</span>;
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "font-semibold",
        up ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]",
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(delta)}
      {mode === "points" ? " pts" : "%"} vs {compareLabel}
    </span>
  );
}

function Kpi({
  label,
  value,
  hint,
  change,
}: {
  label: string;
  value: string;
  hint: string;
  change?: React.ReactNode;
}) {
  return (
    <article className="grid min-w-0 content-start gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-raised)]">
      <p className="m-0 text-sm font-semibold text-[var(--color-text-muted)]">{label}</p>
      <p className="m-0 text-2xl font-extrabold tabular-nums sm:text-3xl">{value}</p>
      {change ? <p className="m-0 text-xs">{change}</p> : null}
      <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">{hint}</p>
    </article>
  );
}

const INSIGHT_STYLE = {
  good: {
    icon: CheckCircle2,
    className: "border-[var(--color-success)] bg-[var(--color-success-soft)]",
    iconClass: "text-[var(--color-success-text)]",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-[var(--color-warning)] bg-[var(--color-warning-soft)]",
    iconClass: "text-[var(--color-warning-text)]",
  },
  info: {
    icon: Info,
    className: "border-[var(--color-border)] bg-[var(--color-surface)]",
    iconClass: "text-[var(--color-info-text)]",
  },
} as const;

function BarRow({
  label,
  value,
  max,
  trailing,
}: {
  label: string;
  value: number;
  max: number;
  trailing: React.ReactNode;
}) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <li className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-semibold">{label}</span>
        <span className="shrink-0 tabular-nums text-[var(--color-text-muted)]">{trailing}</span>
      </div>
      <div aria-hidden="true" className="h-2 rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-2 rounded-full bg-[var(--color-primary)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  );
}

export function AnalyticsRangeTabs({ active }: { active: AnalyticsRangeKey }) {
  return (
    <nav aria-label="Report period" className="flex gap-1 overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-1">
      {RANGE_OPTIONS.map((option) => {
        const selected = option.key === active;
        return (
          <Link
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
              selected
                ? "bg-[var(--color-surface-raised)] text-[var(--color-text)] shadow-[var(--shadow-raised)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
            href={`/admin/analytics?range=${option.key}` as Route}
            key={option.key}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AnalyticsReportView({ report }: { report: AnalyticsReportResponse }) {
  const { totals, previousTotals, funnel } = report;
  const compareLabel =
    report.range.key === "today" ? "yesterday" : "previous period";
  const funnelStart = funnel[0]?.visits ?? 0;
  const dailyMax = Math.max(1, ...report.daily.map((day) => day.visits));
  const hourlyMax = Math.max(1, ...report.hourly);
  const sourceMax = Math.max(1, ...report.sources.map((row) => row.visits));
  const deviceMax = Math.max(1, ...report.devices.map((row) => row.visits));
  const landingMax = Math.max(1, ...report.landingPages.map((row) => row.visits));
  const exitMax = Math.max(1, ...report.exitPages.map((row) => row.visits));

  return (
    <div className="grid gap-6">
      {report.truncated ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-3 text-sm font-semibold" role="status">
          This period has more activity than one report can load, so the
          numbers are a partial view. Choose a shorter period for exact figures.
        </p>
      ) : null}

      <section
        aria-labelledby="analytics-insights-title"
        className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <h2 className="m-0 flex items-center gap-2 text-lg font-extrabold" id="analytics-insights-title">
          <Lightbulb className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          What this means
        </h2>
        <ul className="m-0 grid list-none gap-2 p-0 lg:grid-cols-2">
          {report.insights.map((insight) => {
            const style = INSIGHT_STYLE[insight.tone];
            const Icon = style.icon;
            return (
              <li
                className={cn("flex gap-3 rounded-[var(--radius-sm)] border p-3", style.className)}
                key={insight.title}
              >
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconClass)} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="m-0 text-sm font-bold">{insight.title}</p>
                  <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                    {insight.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi
          change={<Change compareLabel={compareLabel} current={totals.visitors} previous={previousTotals.visitors} />}
          hint={`${formatNumber(totals.newVisitors)} new, ${formatNumber(totals.returningVisitors)} returning.`}
          label="Visitors"
          value={formatNumber(totals.visitors)}
        />
        <Kpi
          change={<Change compareLabel={compareLabel} current={totals.visits} previous={previousTotals.visits} />}
          hint="A visit ends after 30 minutes of no activity."
          label="Visits"
          value={formatNumber(totals.visits)}
        />
        <Kpi
          change={<Change compareLabel={compareLabel} current={totals.ordersPlaced} previous={previousTotals.ordersPlaced} />}
          hint={`${formatNumber(totals.paidOrders)} already confirmed as paid.`}
          label="Orders from the site"
          value={formatNumber(totals.ordersPlaced)}
        />
        <Kpi
          change={
            <Change
              compareLabel={compareLabel}
              current={totals.conversionRate}
              mode="points"
              previous={previousTotals.conversionRate}
            />
          }
          hint="Share of visits that ended in an order."
          label="Visits that ordered"
          value={pct(totals.conversionRate)}
        />
        <Kpi
          change={<Change compareLabel={compareLabel} current={totals.orderValueKobo} previous={previousTotals.orderValueKobo} />}
          hint="Invoice totals of those orders, paid or not."
          label="Order value"
          value={formatNairaFromKobo(totals.orderValueKobo)}
        />
        <Kpi
          hint={`${totals.pagesPerVisit} pages per visit · ${pct(totals.bounceRate)} left after one page.`}
          label="Typical visit"
          value={formatDuration(totals.typicalVisitSeconds)}
        />
      </div>

      <Section
        description="How far each visit got. Every visit is counted at the furthest step it reached, so you can see exactly where customers stop."
        title="Customer journey"
      >
        {funnelStart === 0 ? (
          <EmptyNote>No visits recorded in this period yet.</EmptyNote>
        ) : (
          <ol className="m-0 grid list-none gap-1 p-0">
            {funnel.map((step, index) => (
              <li className="grid gap-1" key={step.key}>
                {index > 0 && step.lostFromPrevious > 0 ? (
                  <p className="m-0 flex items-center gap-1.5 pl-1 text-xs font-semibold text-[var(--color-danger-text)]">
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatNumber(step.lostFromPrevious)} stopped here (
                    {pct(1 - step.percentOfPrevious)} of the step before)
                  </p>
                ) : null}
                <div className="grid gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="m-0 text-sm font-bold">
                      <span className="mr-2 text-[var(--color-text-soft)]">{index + 1}.</span>
                      {step.label}
                    </p>
                    <p className="m-0 text-sm tabular-nums">
                      <span className="font-extrabold">{formatNumber(step.visits)}</span>
                      <span className="text-[var(--color-text-muted)]"> visits · {pct(step.percentOfStart)}</span>
                    </p>
                  </div>
                  <div aria-hidden="true" className="h-3 rounded-full bg-[var(--color-surface-muted)]">
                    <div
                      className="h-3 rounded-full bg-[var(--color-primary)]"
                      style={{ width: `${Math.max(step.visits > 0 ? 1.5 : 0, step.percentOfStart * 100)}%` }}
                    />
                  </div>
                  <p className="m-0 text-xs text-[var(--color-text-muted)]">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section
        description="Visits per day. The number under each bar is orders placed that day."
        title="Daily traffic"
      >
        <div className="overflow-x-auto">
          <ol
            aria-label="Visits per day"
            className="m-0 flex h-48 min-w-full list-none items-end gap-1 p-0"
            style={{ minWidth: `${Math.max(report.daily.length * 1.75, 10)}rem` }}
          >
            {report.daily.map((day) => (
              <li className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" key={day.date}>
                <span className="text-[0.625rem] font-semibold tabular-nums text-[var(--color-text-muted)]">
                  {day.visits}
                </span>
                <div
                  className="w-full max-w-10 rounded-t-[4px] bg-[var(--color-primary)]"
                  style={{ height: `${(day.visits / dailyMax) * 75}%`, minHeight: day.visits ? 3 : 0 }}
                  title={`${formatDayLabel(day.date)}: ${day.visits} visits, ${day.visitors} visitors, ${day.orders} orders`}
                />
                <span className="sr-only">
                  {formatDayLabel(day.date)}: {day.visits} visits, {day.orders} orders
                </span>
              </li>
            ))}
          </ol>
          <ol aria-hidden="true" className="m-0 mt-1 flex list-none gap-1 p-0" style={{ minWidth: `${Math.max(report.daily.length * 1.75, 10)}rem` }}>
            {report.daily.map((day) => (
              <li className="grid min-w-0 flex-1 justify-items-center text-[0.625rem] leading-4 text-[var(--color-text-muted)]" key={day.date}>
                <span className={cn("font-bold", day.orders > 0 ? "text-[var(--color-success-text)]" : "")}>
                  {day.orders}
                </span>
                <span className="truncate">{formatDayLabel(day.date).split(" ").slice(1).join(" ")}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          description="Where each visit came from, and how often those visitors order."
          title="Traffic sources"
        >
          {report.sources.length === 0 ? (
            <EmptyNote>No visits yet.</EmptyNote>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0">
              {report.sources.map((row) => (
                <BarRow
                  key={row.key}
                  label={row.label}
                  max={sourceMax}
                  trailing={`${formatNumber(row.visits)} visits · ${row.orders} orders (${pct(row.conversionRate)})`}
                  value={row.visits}
                />
              ))}
            </ul>
          )}
          <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">
            Tip: add <code>?utm_source=instagram&amp;utm_campaign=weekly-offer</code> to links
            you post so each campaign is counted separately.
          </p>
        </Section>

        <Section description="What customers use to open the site." title="Devices">
          {report.devices.length === 0 ? (
            <EmptyNote>No visits yet.</EmptyNote>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0">
              {report.devices.map((row) => (
                <BarRow
                  key={row.key}
                  label={row.label}
                  max={deviceMax}
                  trailing={`${pct(row.share)} · ${pct(row.conversionRate)} order`}
                  value={row.visits}
                />
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section description="The first page people saw." title="Where visits start">
          {report.landingPages.length === 0 ? (
            <EmptyNote>No visits yet.</EmptyNote>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0">
              {report.landingPages.map((row) => (
                <BarRow
                  key={row.label}
                  label={row.label}
                  max={landingMax}
                  trailing={`${formatNumber(row.visits)} · ${pct(row.share)}`}
                  value={row.visits}
                />
              ))}
            </ul>
          )}
        </Section>

        <Section
          description="The last page seen in visits that did not order. A page high on this list is where customers give up."
          title="Where people left"
        >
          {report.exitPages.length === 0 ? (
            <EmptyNote>Every visit in this period ended in an order.</EmptyNote>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0">
              {report.exitPages.map((row) => (
                <BarRow
                  key={row.label}
                  label={row.label}
                  max={exitMax}
                  trailing={`${formatNumber(row.visits)} · ${pct(row.share)}`}
                  value={row.visits}
                />
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section
        description="Products people opened and how many went on to add them to the cart. A low add rate usually means the photo, price or description needs work."
        title="Product interest"
      >
        {report.products.length === 0 ? (
          <EmptyNote>No product views yet.</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  <th className="border-b border-[var(--color-border)] py-2 pr-3 font-bold">Product</th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 text-right font-bold">Viewed</th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 text-right font-bold">Added to cart</th>
                  <th className="border-b border-[var(--color-border)] py-2 pl-3 text-right font-bold">Add rate</th>
                </tr>
              </thead>
              <tbody>
                {report.products.map((row) => (
                  <tr key={row.productId}>
                    <td className="border-b border-[var(--color-border)] py-2 pr-3 font-semibold">{row.name}</td>
                    <td className="border-b border-[var(--color-border)] px-3 py-2 text-right tabular-nums">{row.views}</td>
                    <td className="border-b border-[var(--color-border)] px-3 py-2 text-right tabular-nums">{row.addedToCart}</td>
                    <td className="border-b border-[var(--color-border)] py-2 pl-3 text-right tabular-nums">
                      {row.views > 0 ? pct(row.addRate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="m-0 mt-2 text-xs text-[var(--color-text-muted)]">
              Counts are visits, not clicks. Items added straight from the menu
              grid count as added without a product-page view.
            </p>
          </div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section description="What customers typed into menu search." title="Searches">
          {report.searches.length === 0 ? (
            <EmptyNote>No searches in this period.</EmptyNote>
          ) : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {report.searches.map((row) => (
                <li className="flex items-center justify-between gap-3 text-sm" key={row.term}>
                  <span className="min-w-0 truncate font-semibold">“{row.term}”</span>
                  <span className="flex shrink-0 items-center gap-2 tabular-nums text-[var(--color-text-muted)]">
                    {row.noResults ? (
                      <span className="rounded-[var(--radius-pill)] border border-[var(--color-warning)] px-2 py-0.5 text-xs font-bold text-[var(--color-warning-text)]">
                        Nothing found
                      </span>
                    ) : null}
                    {row.searches}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          description="Errors customers hit while trying to place an order."
          title="Checkout problems"
        >
          {report.checkoutProblems.length === 0 ? (
            <EmptyNote>No checkout problems recorded. 🎉</EmptyNote>
          ) : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {report.checkoutProblems.map((row) => (
                <li className="flex items-center justify-between gap-3 text-sm" key={row.label}>
                  <span className="min-w-0 font-semibold">{row.label}</span>
                  <span className="shrink-0 tabular-nums text-[var(--color-text-muted)]">{row.count}×</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section
        description={`When visits start, in ${report.range.timeZone} time. Use it to time WhatsApp and Instagram posts.`}
        title="Busy hours"
      >
        <ol aria-label="Visits by hour of day" className="m-0 grid h-32 list-none grid-cols-[repeat(24,minmax(0,1fr))] items-end gap-0.5 p-0">
          {report.hourly.map((visits, hour) => (
            <li className="flex h-full flex-col justify-end" key={hour}>
              <div
                className="rounded-t-[3px] bg-[var(--color-accent)]"
                style={{ height: `${(visits / hourlyMax) * 100}%`, minHeight: visits ? 3 : 0 }}
                title={`${hour}:00 – ${visits} visits`}
              />
              <span className="sr-only">
                {hour}:00, {visits} visits
              </span>
            </li>
          ))}
        </ol>
        <div aria-hidden="true" className="flex justify-between text-[0.625rem] text-[var(--color-text-muted)]">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>11pm</span>
        </div>
      </Section>

      <p className="m-0 text-xs leading-5 text-[var(--color-text-muted)]">
        How this is measured: Sunflour records anonymous steps (pages, product
        views, cart, checkout) with a random browser ID. No names, phone
        numbers or IP addresses are stored, signed-in staff are excluded, and
        browsers with Global Privacy Control are not tracked. Payment status
        comes from the Orders system, not the browser.
      </p>
    </div>
  );
}
