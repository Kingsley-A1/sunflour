import { formatNairaFromKobo } from "@/lib/formatters";
import {
  TRAFFIC_SOURCE_LABELS,
  describePath,
  type TrafficSource,
} from "./analytics-classify";
import { JOURNEY_STAGES, stageForEvent } from "./analytics-events";

/**
 * Pure aggregation: raw journey events in, an owner-readable report out.
 * Kept free of Prisma so every number on the Analytics page is unit-tested.
 */

export interface ReportEventRow {
  sessionId: string;
  visitorId: string;
  occurredAt: Date;
  name: string;
  path: string;
  source: string;
  deviceType: string;
  productId: string | null;
  orderNumber: string | null;
  valueKobo: number | null;
  label: string | null;
  metadata: unknown;
}

export interface ReportOrderRow {
  orderNumber: string;
  paymentStatus: string;
  status: string;
  total: number;
}

export interface ReportWindow {
  from: Date;
  to: Date;
}

export interface BuildReportInput {
  events: ReportEventRow[];
  previousEvents: ReportEventRow[];
  orders: ReportOrderRow[];
  productNames: Map<string, string>;
  window: ReportWindow;
  timeZone: string;
}

export interface ReportTotals {
  visitors: number;
  newVisitors: number;
  returningVisitors: number;
  visits: number;
  pageViews: number;
  pagesPerVisit: number;
  typicalVisitSeconds: number;
  bounceRate: number;
  ordersPlaced: number;
  orderValueKobo: number;
  paidOrders: number;
  conversionRate: number;
  abandonedCarts: number;
  abandonedCartValueKobo: number;
}

export interface FunnelStep {
  key: string;
  label: string;
  description: string;
  visits: number;
  percentOfStart: number;
  percentOfPrevious: number;
  lostFromPrevious: number;
}

export type InsightTone = "good" | "warning" | "info";

export interface ReportInsight {
  tone: InsightTone;
  title: string;
  detail: string;
}

export interface ReportBreakdownRow {
  key: string;
  label: string;
  visits: number;
  orders: number;
  conversionRate: number;
  share: number;
}

export interface ReportPageRow {
  label: string;
  visits: number;
  share: number;
}

export interface ReportProductRow {
  productId: string;
  name: string;
  views: number;
  addedToCart: number;
  addRate: number;
}

export interface ReportSearchRow {
  term: string;
  searches: number;
  noResults: boolean;
}

export interface ReportDailyRow {
  date: string;
  visitors: number;
  visits: number;
  orders: number;
}

export interface AnalyticsReport {
  totals: ReportTotals;
  previousTotals: ReportTotals;
  funnel: FunnelStep[];
  insights: ReportInsight[];
  daily: ReportDailyRow[];
  hourly: number[];
  sources: ReportBreakdownRow[];
  devices: ReportBreakdownRow[];
  landingPages: ReportPageRow[];
  exitPages: ReportPageRow[];
  products: ReportProductRow[];
  searches: ReportSearchRow[];
  checkoutProblems: Array<{ label: string; count: number }>;
}

interface SessionSummary {
  id: string;
  visitorId: string;
  start: Date;
  end: Date;
  pageViews: number;
  landingPath: string | null;
  exitPath: string | null;
  source: string;
  deviceType: string;
  isNewVisitor: boolean;
  stage: number;
  orderNumbers: Set<string>;
  cartValueKobo: number;
}

const PROOF_PAYMENT_STATUSES = new Set([
  "PROOF_SENT_ON_WHATSAPP",
  "UNDER_REVIEW",
  "CONFIRMED",
]);
const STAGE_PLACED = 4;
const STAGE_PROOF = 5;
const STAGE_PAID = 6;
const STAGE_CART = 2;

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Phone",
  tablet: "Tablet",
  desktop: "Computer",
};

function ratio(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}

function readMetadata(metadata: unknown, key: string): unknown {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return (metadata as Record<string, unknown>)[key];
  }
  return undefined;
}

function summarizeSessions(
  events: ReportEventRow[],
  orders: Map<string, ReportOrderRow>,
  proofSentOrders: Set<string>,
): SessionSummary[] {
  const bySession = new Map<string, ReportEventRow[]>();
  for (const event of events) {
    const list = bySession.get(event.sessionId);
    if (list) {
      list.push(event);
    } else {
      bySession.set(event.sessionId, [event]);
    }
  }

  const sessions: SessionSummary[] = [];
  for (const [id, list] of bySession) {
    list.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    const first = list[0];
    const last = list[list.length - 1];
    if (!first || !last) {
      continue;
    }

    const summary: SessionSummary = {
      id,
      visitorId: first.visitorId,
      start: first.occurredAt,
      end: last.occurredAt,
      pageViews: 0,
      landingPath: null,
      exitPath: null,
      source: first.source,
      deviceType: first.deviceType,
      isNewVisitor: false,
      stage: 0,
      orderNumbers: new Set(),
      cartValueKobo: 0,
    };

    for (const event of list) {
      if (event.name === "page_view") {
        summary.pageViews += 1;
        summary.landingPath ??= event.path;
        summary.exitPath = event.path;
        if (readMetadata(event.metadata, "newVisitor") === true) {
          summary.isNewVisitor = true;
        }
      }
      if (event.name === "add_to_cart" && event.valueKobo) {
        summary.cartValueKobo += event.valueKobo;
      }
      if (event.name === "order_placed" && event.orderNumber) {
        summary.orderNumbers.add(event.orderNumber);
      }
      // Proof is credited through the order it belongs to (below), so a
      // customer returning days later to send proof doesn't make that new
      // visit look like it browsed and added to cart.
      if (event.name !== "proof_sent") {
        summary.stage = Math.max(summary.stage, stageForEvent(event.name, event.path));
      }
    }

    for (const orderNumber of summary.orderNumbers) {
      const order = orders.get(orderNumber);
      if (order?.paymentStatus === "CONFIRMED") {
        summary.stage = Math.max(summary.stage, STAGE_PAID);
      } else if (
        proofSentOrders.has(orderNumber) ||
        (order && PROOF_PAYMENT_STATUSES.has(order.paymentStatus))
      ) {
        summary.stage = Math.max(summary.stage, STAGE_PROOF);
      }
    }

    sessions.push(summary);
  }

  return sessions;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 0
      ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
      : (sorted[middle] ?? 0);
  return Math.round(value);
}

function computeTotals(
  sessions: SessionSummary[],
  orders: Map<string, ReportOrderRow>,
): ReportTotals {
  const visitors = new Set<string>();
  const newVisitors = new Set<string>();
  const placedOrders = new Set<string>();
  let pageViews = 0;
  let bounces = 0;
  let converted = 0;
  let abandonedCarts = 0;
  let abandonedCartValueKobo = 0;
  const engagedDurations: number[] = [];

  for (const session of sessions) {
    visitors.add(session.visitorId);
    if (session.isNewVisitor) {
      newVisitors.add(session.visitorId);
    }
    pageViews += session.pageViews;
    if (session.stage === 0 && session.pageViews <= 1) {
      bounces += 1;
    }
    if (session.stage >= STAGE_PLACED) {
      converted += 1;
    }
    if (session.stage >= STAGE_CART && session.stage < STAGE_PLACED) {
      abandonedCarts += 1;
      abandonedCartValueKobo += session.cartValueKobo;
    }
    const seconds = (session.end.getTime() - session.start.getTime()) / 1000;
    if (seconds > 0) {
      engagedDurations.push(seconds);
    }
    for (const orderNumber of session.orderNumbers) {
      placedOrders.add(orderNumber);
    }
  }

  let orderValueKobo = 0;
  let paidOrders = 0;
  for (const orderNumber of placedOrders) {
    const order = orders.get(orderNumber);
    if (!order) {
      continue;
    }
    // Server-stored totals only; the browser's numbers are never trusted.
    orderValueKobo += order.total;
    if (order.paymentStatus === "CONFIRMED") {
      paidOrders += 1;
    }
  }

  return {
    visitors: visitors.size,
    newVisitors: newVisitors.size,
    returningVisitors: Math.max(0, visitors.size - newVisitors.size),
    visits: sessions.length,
    pageViews,
    pagesPerVisit: Math.round(ratio(pageViews, sessions.length) * 10) / 10,
    typicalVisitSeconds: median(engagedDurations),
    bounceRate: ratio(bounces, sessions.length),
    ordersPlaced: placedOrders.size,
    orderValueKobo,
    paidOrders,
    conversionRate: ratio(converted, sessions.length),
    abandonedCarts,
    abandonedCartValueKobo,
  };
}

function computeFunnel(sessions: SessionSummary[]): FunnelStep[] {
  const reached = JOURNEY_STAGES.map(
    (_, index) => sessions.filter((session) => session.stage >= index).length,
  );
  const start = reached[0] ?? 0;

  return JOURNEY_STAGES.map((stage, index) => {
    const visits = reached[index] ?? 0;
    const previous = index === 0 ? visits : (reached[index - 1] ?? 0);
    return {
      key: stage.key,
      label: stage.label,
      description: stage.description,
      visits,
      percentOfStart: ratio(visits, start),
      percentOfPrevious: index === 0 ? 1 : ratio(visits, previous),
      lostFromPrevious: index === 0 ? 0 : Math.max(0, previous - visits),
    };
  });
}

function breakdown(
  sessions: SessionSummary[],
  keyOf: (session: SessionSummary) => string,
  labelOf: (key: string) => string,
): ReportBreakdownRow[] {
  const groups = new Map<string, { visits: number; orders: number }>();
  for (const session of sessions) {
    const key = keyOf(session);
    const group = groups.get(key) ?? { visits: 0, orders: 0 };
    group.visits += 1;
    if (session.stage >= STAGE_PLACED) {
      group.orders += 1;
    }
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      label: labelOf(key),
      visits: group.visits,
      orders: group.orders,
      conversionRate: ratio(group.orders, group.visits),
      share: ratio(group.visits, sessions.length),
    }))
    .sort((a, b) => b.visits - a.visits);
}

function topPages(
  paths: Array<string | null>,
  limit: number,
): ReportPageRow[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const path of paths) {
    if (!path) {
      continue;
    }
    const label = describePath(path);
    counts.set(label, (counts.get(label) ?? 0) + 1);
    total += 1;
  }
  return [...counts.entries()]
    .map(([label, visits]) => ({ label, visits, share: ratio(visits, total) }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);
}

function computeProducts(
  events: ReportEventRow[],
  productNames: Map<string, string>,
): ReportProductRow[] {
  const views = new Map<string, Set<string>>();
  const adds = new Map<string, Set<string>>();
  for (const event of events) {
    if (!event.productId) {
      continue;
    }
    const target =
      event.name === "product_view"
        ? views
        : event.name === "add_to_cart"
          ? adds
          : null;
    if (!target) {
      continue;
    }
    const set = target.get(event.productId) ?? new Set<string>();
    set.add(event.sessionId);
    target.set(event.productId, set);
  }

  const ids = new Set([...views.keys(), ...adds.keys()]);
  return [...ids]
    .map((productId) => {
      const viewCount = views.get(productId)?.size ?? 0;
      const addCount = adds.get(productId)?.size ?? 0;
      return {
        productId,
        name: productNames.get(productId) ?? "Removed product",
        views: viewCount,
        addedToCart: addCount,
        addRate: ratio(addCount, viewCount),
      };
    })
    .sort((a, b) => b.views + b.addedToCart - (a.views + a.addedToCart))
    .slice(0, 10);
}

function computeSearches(events: ReportEventRow[]): ReportSearchRow[] {
  const terms = new Map<string, { searches: number; noResults: boolean }>();
  for (const event of events) {
    if (event.name !== "search" || !event.label) {
      continue;
    }
    const entry = terms.get(event.label) ?? { searches: 0, noResults: false };
    entry.searches += 1;
    // The latest search wins: a term that started returning results (a new
    // product was added) stops being flagged.
    entry.noResults = readMetadata(event.metadata, "results") === 0;
    terms.set(event.label, entry);
  }
  return [...terms.entries()]
    .map(([term, entry]) => ({ term, ...entry }))
    .sort((a, b) => b.searches - a.searches)
    .slice(0, 12);
}

function computeCheckoutProblems(events: ReportEventRow[]) {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.name === "checkout_error") {
      const label = event.label ?? "Unknown problem";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function makeDateKeyFormatter(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return (date: Date) => formatter.format(date);
}

function makeHourFormatter(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  });
  return (date: Date) => Number(formatter.format(date)) % 24;
}

function computeDaily(
  sessions: SessionSummary[],
  window: ReportWindow,
  timeZone: string,
): ReportDailyRow[] {
  const dateKey = makeDateKeyFormatter(timeZone);
  const days = new Map<string, { visitors: Set<string>; visits: number; orders: Set<string> }>();

  // Seed every day in the window so quiet days show as zero, not as gaps.
  for (
    let cursor = window.from.getTime();
    cursor < window.to.getTime();
    cursor += 24 * 60 * 60_000
  ) {
    days.set(dateKey(new Date(cursor)), { visitors: new Set(), visits: 0, orders: new Set() });
  }
  const lastKey = dateKey(new Date(window.to.getTime() - 1));
  if (!days.has(lastKey)) {
    days.set(lastKey, { visitors: new Set(), visits: 0, orders: new Set() });
  }

  for (const session of sessions) {
    const key = dateKey(session.start);
    const day = days.get(key);
    if (!day) {
      continue;
    }
    day.visitors.add(session.visitorId);
    day.visits += 1;
    for (const orderNumber of session.orderNumbers) {
      day.orders.add(orderNumber);
    }
  }

  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, day]) => ({
      date,
      visitors: day.visitors.size,
      visits: day.visits,
      orders: day.orders.size,
    }));
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatHourRange(hour: number): string {
  const format = (h: number) => {
    const normalized = h % 24;
    const suffix = normalized < 12 ? "am" : "pm";
    const display = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${display}${suffix}`;
  };
  return `${format(hour)}–${format(hour + 1)}`;
}

const STAGE_ADVICE: Record<string, string> = {
  browsed:
    "Many visitors leave without opening the menu. Make the homepage point clearly to the menu and this week's offer.",
  added_to_cart:
    "People look at products but don't add them. Check photos, prices, sizes and sold-out items.",
  started_checkout:
    "Items are added but checkout isn't opened. Remind customers on the cart page and check how the delivery fee is shown.",
  placed_order:
    "Customers open checkout but don't submit. See “Checkout problems” below for the errors they hit.",
  sent_proof:
    "Orders are placed but payment proof isn't sent. Staff can follow up on WhatsApp from the Orders page.",
  paid:
    "Payment proofs are waiting for verification. Confirm them on the Orders page so orders can move.",
};

function buildInsights(
  report: Omit<AnalyticsReport, "insights">,
): ReportInsight[] {
  const insights: ReportInsight[] = [];
  const { totals, previousTotals, funnel } = report;

  if (totals.visits === 0) {
    return [
      {
        tone: "info",
        title: "No visits recorded yet for this period",
        detail:
          "Numbers appear as soon as customers open the site. Staff visits while signed in are not counted.",
      },
    ];
  }

  if (previousTotals.visits > 0) {
    const change = ratio(totals.visits - previousTotals.visits, previousTotals.visits);
    if (Math.abs(change) >= 0.1) {
      insights.push({
        tone: change > 0 ? "good" : "warning",
        title: `Visits are ${change > 0 ? "up" : "down"} ${percent(Math.abs(change))} on the previous period`,
        detail: `${totals.visits} visits now, compared with ${previousTotals.visits} before.`,
      });
    }
  }

  // Biggest leak: the step that loses the most visits (ignoring tiny samples).
  const leak = funnel
    .slice(1)
    .filter((step) => step.lostFromPrevious >= 3)
    .sort((a, b) => b.lostFromPrevious - a.lostFromPrevious)[0];
  if (leak) {
    const index = funnel.findIndex((step) => step.key === leak.key);
    const previous = funnel[index - 1];
    insights.push({
      tone: "warning",
      title: `Biggest drop: ${previous?.label ?? "previous step"} → ${leak.label}`,
      detail: `${leak.lostFromPrevious} of ${previous?.visits ?? 0} visits (${percent(1 - leak.percentOfPrevious)}) stopped here. ${STAGE_ADVICE[leak.key] ?? ""}`.trim(),
    });
  }

  if (totals.abandonedCarts > 0) {
    insights.push({
      tone: "warning",
      title: `${totals.abandonedCarts} ${totals.abandonedCarts === 1 ? "visit" : "visits"} left items in the cart`,
      detail:
        totals.abandonedCartValueKobo > 0
          ? `About ${formatNairaFromKobo(totals.abandonedCartValueKobo)} worth of food was added but never ordered.`
          : "Items were added but no order was placed.",
    });
  }

  const topSource = report.sources[0];
  if (topSource) {
    const bestConverting = report.sources
      .filter((source) => source.visits >= 5 && source.orders > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)[0];
    insights.push({
      tone: "info",
      title: `Most visits come from ${topSource.label} (${percent(topSource.share)})`,
      detail:
        bestConverting && bestConverting.key !== topSource.key
          ? `${bestConverting.label} visitors order most often: ${percent(bestConverting.conversionRate)} of their visits end in an order.`
          : `${percent(topSource.conversionRate)} of those visits end in an order.`,
    });
  }

  const missedSearches = report.searches.filter((search) => search.noResults);
  if (missedSearches.length > 0) {
    insights.push({
      tone: "warning",
      title: "Customers searched for things they couldn't find",
      detail: `${missedSearches
        .slice(0, 4)
        .map((search) => `“${search.term}” (${search.searches}×)`)
        .join(", ")}. Consider adding these items or matching names to the menu.`,
    });
  }

  const weakProduct = report.products
    .filter((product) => product.views >= 10)
    .sort((a, b) => a.addRate - b.addRate)[0];
  if (weakProduct && weakProduct.addRate < 0.1) {
    insights.push({
      tone: "info",
      title: `${weakProduct.name} gets attention but few orders`,
      detail: `Viewed in ${weakProduct.views} visits but added to cart in only ${weakProduct.addedToCart}. Check its photo, price and description.`,
    });
  }

  const phone = report.devices.find((device) => device.key === "mobile");
  if (phone && phone.share >= 0.6) {
    insights.push({
      tone: "info",
      title: `${percent(phone.share)} of visits are on a phone`,
      detail: "Always check new products, banners and offers on a phone first.",
    });
  }

  const busiestHour = report.hourly.reduce(
    (best, visits, hour) => (visits > (report.hourly[best] ?? 0) ? hour : best),
    0,
  );
  if ((report.hourly[busiestHour] ?? 0) > 0) {
    insights.push({
      tone: "info",
      title: `Busiest time: ${formatHourRange(busiestHour)}`,
      detail:
        "Post offers on WhatsApp and Instagram shortly before this time and keep staff ready to verify payments.",
    });
  }

  return insights.slice(0, 7);
}

export function buildAnalyticsReport(input: BuildReportInput): AnalyticsReport {
  const orders = new Map(input.orders.map((order) => [order.orderNumber, order]));
  const proofSentOrders = new Set(
    [...input.events, ...input.previousEvents]
      .filter((event) => event.name === "proof_sent" && event.orderNumber)
      .map((event) => event.orderNumber as string),
  );
  const sessions = summarizeSessions(input.events, orders, proofSentOrders);
  const previousSessions = summarizeSessions(input.previousEvents, orders, proofSentOrders);
  const hourOf = makeHourFormatter(input.timeZone);
  const hourly = Array.from({ length: 24 }, () => 0);
  for (const session of sessions) {
    const hour = hourOf(session.start);
    hourly[hour] = (hourly[hour] ?? 0) + 1;
  }

  const base: Omit<AnalyticsReport, "insights"> = {
    totals: computeTotals(sessions, orders),
    previousTotals: computeTotals(previousSessions, orders),
    funnel: computeFunnel(sessions),
    daily: computeDaily(sessions, input.window, input.timeZone),
    hourly,
    sources: breakdown(
      sessions,
      (session) => session.source,
      (key) => TRAFFIC_SOURCE_LABELS[key as TrafficSource] ?? key,
    ),
    devices: breakdown(
      sessions,
      (session) => session.deviceType,
      (key) => DEVICE_LABELS[key] ?? key,
    ),
    landingPages: topPages(sessions.map((session) => session.landingPath), 8),
    // Only visits that ended without an order: "where did people give up?"
    exitPages: topPages(
      sessions
        .filter((session) => session.stage < STAGE_PLACED)
        .map((session) => session.exitPath),
      8,
    ),
    products: computeProducts(input.events, input.productNames),
    searches: computeSearches(input.events),
    checkoutProblems: computeCheckoutProblems(input.events),
  };

  return { ...base, insights: buildInsights(base) };
}
