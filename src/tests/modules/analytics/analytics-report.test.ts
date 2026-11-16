import { describe, expect, it } from "vitest";
import {
  buildAnalyticsReport,
  type ReportEventRow,
} from "@/server/modules/analytics/analytics-report";
import { resolveAnalyticsWindow } from "@/server/modules/analytics/analytics-report-service";

const TZ = "Africa/Lagos";
const window = {
  from: new Date("2026-11-09T23:00:00.000Z"),
  to: new Date("2026-11-16T23:00:00.000Z"),
};

let clock = new Date("2026-11-16T09:00:00.000Z").getTime();
function event(
  sessionId: string,
  name: string,
  overrides: Partial<ReportEventRow> = {},
): ReportEventRow {
  clock += 30_000;
  return {
    sessionId,
    visitorId: `v-${sessionId}`,
    occurredAt: new Date(clock),
    name,
    path: "/",
    source: "direct",
    deviceType: "mobile",
    productId: null,
    orderNumber: null,
    valueKobo: null,
    label: null,
    metadata: null,
    ...overrides,
  };
}

function buildFixture() {
  return [
    // s1: bounced on the homepage.
    event("s1", "page_view", { metadata: { newVisitor: true } }),
    // s2: browsed a product, left from the product page.
    event("s2", "page_view", { source: "instagram" }),
    event("s2", "page_view", { path: "/products/meat-pie", source: "instagram" }),
    event("s2", "product_view", { path: "/products/meat-pie", productId: "p1", source: "instagram" }),
    // s3: added to cart, abandoned at checkout with a form error.
    event("s3", "page_view", { path: "/menu", source: "whatsapp" }),
    event("s3", "add_to_cart", { path: "/menu", productId: "p1", valueKobo: 150_000, source: "whatsapp" }),
    event("s3", "page_view", { path: "/checkout", source: "whatsapp" }),
    event("s3", "checkout_start", { path: "/checkout", source: "whatsapp" }),
    event("s3", "checkout_error", { path: "/checkout", label: "Form not complete: phone", source: "whatsapp" }),
    // s4: ordered and paid.
    event("s4", "page_view", { path: "/menu", source: "whatsapp", deviceType: "desktop" }),
    event("s4", "search", { path: "/menu", label: "shawarma", metadata: { results: 0 }, source: "whatsapp", deviceType: "desktop" }),
    event("s4", "add_to_cart", { path: "/menu", productId: "p2", valueKobo: 500_000, source: "whatsapp", deviceType: "desktop" }),
    event("s4", "checkout_start", { path: "/checkout", source: "whatsapp", deviceType: "desktop" }),
    event("s4", "order_placed", { path: "/checkout", orderNumber: "SFB-1", valueKobo: 1, source: "whatsapp", deviceType: "desktop" }),
    // s5: a later visit only to send proof for another order (placed in s6).
    event("s6", "add_to_cart", { path: "/menu", productId: "p2", valueKobo: 200_000 }),
    event("s6", "order_placed", { path: "/checkout", orderNumber: "SFB-2" }),
    event("s5", "page_view", { path: "/orders/SFB-2/invoice" }),
    event("s5", "proof_sent", { path: "/orders/SFB-2/invoice", orderNumber: "SFB-2" }),
  ];
}

describe("analytics report", () => {
  const report = buildAnalyticsReport({
    events: buildFixture(),
    previousEvents: [event("old", "page_view")],
    orders: [
      { orderNumber: "SFB-1", paymentStatus: "CONFIRMED", status: "PREPARING", total: 520_000 },
      { orderNumber: "SFB-2", paymentStatus: "UNPAID", status: "PENDING_PAYMENT", total: 210_000 },
    ],
    productNames: new Map([
      ["p1", "Meat pie"],
      ["p2", "Shawarma"],
    ]),
    window,
    timeZone: TZ,
  });

  it("counts each visit at the furthest step it reached", () => {
    expect(report.funnel.map((step) => [step.key, step.visits])).toEqual([
      ["visited", 6],
      ["browsed", 4],
      ["added_to_cart", 3],
      ["started_checkout", 3],
      ["placed_order", 2],
      ["sent_proof", 2],
      ["paid", 1],
    ]);
    expect(report.funnel[1]?.lostFromPrevious).toBe(2);
    expect(report.funnel[4]?.percentOfPrevious).toBeCloseTo(2 / 3);
  });

  it("does not credit a proof-only return visit with browsing or ordering", () => {
    // s5 only sent proof; it stays at "visited" while its order (s6) moves on.
    expect(report.funnel[0]?.visits).toBe(6);
    expect(report.totals.ordersPlaced).toBe(2);
  });

  it("uses server order totals, never browser values", () => {
    expect(report.totals.orderValueKobo).toBe(730_000);
    expect(report.totals.paidOrders).toBe(1);
  });

  it("summarises totals, abandonment and comparisons", () => {
    expect(report.totals.visits).toBe(6);
    expect(report.totals.visitors).toBe(6);
    expect(report.totals.newVisitors).toBe(1);
    expect(report.totals.conversionRate).toBeCloseTo(2 / 6);
    expect(report.totals.abandonedCarts).toBe(1);
    expect(report.totals.abandonedCartValueKobo).toBe(150_000);
    expect(report.previousTotals.visits).toBe(1);
  });

  it("breaks visits down by source, device, pages, products and searches", () => {
    expect(report.sources[0]).toMatchObject({ key: "direct", visits: 3 });
    expect(report.sources.find((row) => row.key === "whatsapp")).toMatchObject({
      visits: 2,
      orders: 1,
      conversionRate: 0.5,
    });
    expect(report.devices.find((row) => row.key === "desktop")?.visits).toBe(1);
    expect(report.exitPages.map((row) => row.label)).toContain("Checkout");
    expect(report.products.find((row) => row.productId === "p1")).toMatchObject({
      name: "Meat pie",
      views: 1,
      addedToCart: 1,
    });
    expect(report.searches).toEqual([{ term: "shawarma", searches: 1, noResults: true }]);
    expect(report.checkoutProblems).toEqual([{ label: "Form not complete: phone", count: 1 }]);
  });

  it("buckets days and hours in Lagos time with every day present", () => {
    expect(report.daily).toHaveLength(7);
    expect(report.daily.at(-1)?.date).toBe("2026-11-16");
    expect(report.daily.at(-1)?.visits).toBe(6);
    expect(report.hourly.reduce((a, b) => a + b, 0)).toBe(6);
    expect(report.hourly[10]).toBeGreaterThan(0);
  });

  it("explains the numbers in plain language", () => {
    const titles = report.insights.map((insight) => insight.title);
    expect(titles.some((title) => title.startsWith("Visits are up"))).toBe(true);
    expect(titles).toContain("Customers searched for things they couldn't find");
    expect(titles.some((title) => title.includes("left items in the cart"))).toBe(true);
  });

  it("gives a friendly message when there is no data", () => {
    const empty = buildAnalyticsReport({
      events: [],
      previousEvents: [],
      orders: [],
      productNames: new Map(),
      window,
      timeZone: TZ,
    });
    expect(empty.totals.visits).toBe(0);
    expect(empty.funnel.every((step) => step.visits === 0)).toBe(true);
    expect(empty.insights[0]?.title).toMatch(/No visits/);
  });
});

describe("analytics report window", () => {
  it("uses whole Lagos days ending tonight and an equal previous period", () => {
    const now = new Date("2026-11-16T10:00:00.000Z");
    const week = resolveAnalyticsWindow("7d", now, TZ);
    expect(week.from.toISOString()).toBe("2026-11-09T23:00:00.000Z");
    expect(week.to.toISOString()).toBe("2026-11-16T23:00:00.000Z");
    expect(week.previousFrom.toISOString()).toBe("2026-11-02T23:00:00.000Z");

    const today = resolveAnalyticsWindow("today", now, TZ);
    expect(today.from.toISOString()).toBe("2026-11-15T23:00:00.000Z");
    expect(today.previousFrom.toISOString()).toBe("2026-11-14T23:00:00.000Z");
  });
});
