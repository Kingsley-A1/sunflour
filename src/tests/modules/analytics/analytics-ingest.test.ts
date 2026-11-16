import { describe, expect, it } from "vitest";
import { buildSiteEventRows } from "@/server/modules/analytics/analytics-ingest-service";

const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";

describe("analytics ingest", () => {
  const now = new Date("2026-11-16T10:00:00.000Z");
  const batch = {
    visitorId: "visitor-00000001",
    sessionId: "session-00000001",
    sentAt: 50_000,
    referrer: "https://l.instagram.com/",
    utmCampaign: "Weekly-Offer",
    events: [
      { name: "page_view" as const, path: "/track-order?phone=0801", at: 45_000 },
      { name: "search" as const, path: "/menu", at: 49_000, label: "Meat PIE", metadata: { results: 0 } },
    ],
  };

  it("stamps server time, keeps batch order and stores readable categories", () => {
    const rows = buildSiteEventRows(batch, {
      userAgent: ANDROID_CHROME,
      siteHost: "sunflourbakery.ng",
      now,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.occurredAt).toEqual(new Date(now.getTime() - 5_000));
    expect(rows[1]?.occurredAt).toEqual(new Date(now.getTime() - 1_000));
    expect(rows[0]).toMatchObject({
      path: "/track-order",
      source: "instagram",
      referrerHost: "l.instagram.com",
      utmCampaign: "weekly-offer",
      deviceType: "mobile",
      os: "Android",
    });
    expect(rows[1]?.label).toBe("meat pie");
  });

  it("never lets a wrong phone clock move events far from now", () => {
    const rows = buildSiteEventRows(
      { ...batch, sentAt: 10_000_000_000, events: [{ name: "page_view", path: "/", at: 1 }] },
      { userAgent: ANDROID_CHROME, siteHost: null, now },
    );
    expect(now.getTime() - (rows[0]?.occurredAt as Date).getTime()).toBe(10 * 60_000);

    const future = buildSiteEventRows(
      { ...batch, sentAt: 1, events: [{ name: "page_view", path: "/", at: 99_999 }] },
      { userAgent: ANDROID_CHROME, siteHost: null, now },
    );
    expect(future[0]?.occurredAt).toEqual(now);
  });
});
