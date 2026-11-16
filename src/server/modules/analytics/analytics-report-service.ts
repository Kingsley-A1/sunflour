import { getServerEnv } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { getLocalDayUtcRange } from "@/server/lib/date-time";
import {
  buildAnalyticsReport,
  type AnalyticsReport,
  type ReportEventRow,
} from "./analytics-report";
import type {
  AnalyticsRangeKey,
  AnalyticsReportQueryInput,
} from "./analytics-schemas";

const DAY_MS = 24 * 60 * 60_000;
/**
 * Guard rail for one report. At Sunflour's traffic this covers months of
 * data; if it is ever hit the page says so instead of silently undercounting.
 */
const MAX_EVENTS_PER_WINDOW = 150_000;

const RANGE_DAYS: Record<AnalyticsRangeKey, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const RANGE_LABELS: Record<AnalyticsRangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export interface AnalyticsReportResponse extends AnalyticsReport {
  range: {
    key: AnalyticsRangeKey;
    label: string;
    from: string;
    to: string;
    previousFrom: string;
    timeZone: string;
  };
  truncated: boolean;
}

export function resolveAnalyticsWindow(
  key: AnalyticsRangeKey,
  now: Date,
  timeZone: string,
) {
  const days = RANGE_DAYS[key];
  // Whole local days, ending at the end of today, so "Last 7 days" means
  // today plus the six days before it in Lagos time.
  const today = getLocalDayUtcRange(now, timeZone);
  const from = getLocalDayUtcRange(
    new Date(today.start.getTime() - (days - 1) * DAY_MS + DAY_MS / 2),
    timeZone,
  ).start;
  const to = today.end;
  const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));

  return { from, to, previousFrom };
}

const eventSelect = {
  sessionId: true,
  visitorId: true,
  occurredAt: true,
  name: true,
  path: true,
  source: true,
  deviceType: true,
  productId: true,
  orderNumber: true,
  valueKobo: true,
  label: true,
  metadata: true,
} as const;

async function loadEvents(from: Date, to: Date): Promise<ReportEventRow[]> {
  return prisma.siteEvent.findMany({
    where: { occurredAt: { gte: from, lt: to } },
    select: eventSelect,
    orderBy: { occurredAt: "asc" },
    take: MAX_EVENTS_PER_WINDOW,
  });
}

export async function getAnalyticsReport(
  input: AnalyticsReportQueryInput,
  now = new Date(),
): Promise<AnalyticsReportResponse> {
  const timeZone = getServerEnv().APP_TIME_ZONE;
  const window = resolveAnalyticsWindow(input.range, now, timeZone);
  const [events, previousEvents] = await Promise.all([
    loadEvents(window.from, window.to),
    loadEvents(window.previousFrom, window.from),
  ]);

  const orderNumbers = [
    ...new Set(
      [...events, ...previousEvents]
        .map((event) => event.orderNumber)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const productIds = [
    ...new Set(
      events
        .map((event) => event.productId)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const [orders, products] = await Promise.all([
    orderNumbers.length
      ? prisma.order.findMany({
          where: { orderNumber: { in: orderNumbers } },
          select: {
            orderNumber: true,
            paymentStatus: true,
            status: true,
            total: true,
          },
        })
      : Promise.resolve([]),
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const report = buildAnalyticsReport({
    events,
    previousEvents,
    orders,
    productNames: new Map(products.map((product) => [product.id, product.name])),
    window: { from: window.from, to: window.to },
    timeZone,
  });

  return {
    ...report,
    range: {
      key: input.range,
      label: RANGE_LABELS[input.range],
      from: window.from.toISOString(),
      to: window.to.toISOString(),
      previousFrom: window.previousFrom.toISOString(),
      timeZone,
    },
    truncated:
      events.length >= MAX_EVENTS_PER_WINDOW ||
      previousEvents.length >= MAX_EVENTS_PER_WINDOW,
  };
}
