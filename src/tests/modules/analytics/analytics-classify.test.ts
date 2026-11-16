import { describe, expect, it } from "vitest";
import {
  classifyTrafficSource,
  describePath,
  isLikelyBot,
  normalizeEventPath,
  parseUserAgent,
} from "@/server/modules/analytics/analytics-classify";
import { stageForEvent } from "@/server/modules/analytics/analytics-events";
import { siteEventBatchSchema } from "@/server/modules/analytics/analytics-schemas";

const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; SM-A146P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/604.1";
const WINDOWS_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0";

describe("analytics classification", () => {
  it("credits a visit to the site that referred it", () => {
    expect(classifyTrafficSource({ referrer: "https://l.instagram.com/?u=x" }).source).toBe("instagram");
    expect(classifyTrafficSource({ referrer: "https://www.google.com.ng/" }).source).toBe("google");
    expect(classifyTrafficSource({ referrer: "https://wa.me/234800" }).source).toBe("whatsapp");
    expect(classifyTrafficSource({ referrer: "https://m.facebook.com/" }).source).toBe("facebook");
    expect(classifyTrafficSource({ referrer: "https://t.co/abc" }).source).toBe("x");
    expect(classifyTrafficSource({ referrer: "https://blog.example.com/post" })).toEqual({
      source: "other_site",
      referrerHost: "blog.example.com",
    });
  });

  it("treats no referrer and internal navigation as direct", () => {
    expect(classifyTrafficSource({}).source).toBe("direct");
    expect(
      classifyTrafficSource({
        referrer: "https://www.sunflourbakery.ng/menu",
        siteHost: "sunflourbakery.ng",
      }),
    ).toEqual({ source: "direct", referrerHost: null });
    expect(classifyTrafficSource({ referrer: "not a url" }).source).toBe("direct");
  });

  it("lets a tagged link win over the referrer", () => {
    expect(
      classifyTrafficSource({ referrer: "https://google.com", utmSource: "WhatsApp" }).source,
    ).toBe("whatsapp");
    expect(classifyTrafficSource({ utmSource: "flyer-oct" }).source).toBe("campaign");
  });

  it("reads device, browser and OS from the user agent", () => {
    expect(parseUserAgent(ANDROID_CHROME)).toEqual({ deviceType: "mobile", browser: "Chrome", os: "Android" });
    expect(parseUserAgent(IPHONE_SAFARI)).toEqual({ deviceType: "mobile", browser: "Safari", os: "iOS" });
    expect(parseUserAgent(IPAD).deviceType).toBe("tablet");
    expect(parseUserAgent(WINDOWS_EDGE)).toEqual({ deviceType: "desktop", browser: "Edge", os: "Windows" });
  });

  it("drops crawlers and link-preview fetchers", () => {
    expect(isLikelyBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    expect(isLikelyBot("WhatsApp/2.23.20.0")).toBe(true);
    expect(isLikelyBot("facebookexternalhit/1.1")).toBe(true);
    expect(isLikelyBot(null)).toBe(true);
    expect(isLikelyBot(ANDROID_CHROME)).toBe(false);
  });

  it("strips query strings so phone numbers never reach storage", () => {
    expect(normalizeEventPath("/track-order?phone=08012345678")).toBe("/track-order");
    expect(normalizeEventPath("/menu/#cakes")).toBe("/menu");
    expect(normalizeEventPath("/")).toBe("/");
  });

  it("names pages the way an owner would", () => {
    expect(describePath("/")).toBe("Homepage");
    expect(describePath("/products/meat-pie")).toBe("Product page");
    expect(describePath("/orders/SFB-20261111-ABC/invoice")).toBe("Invoice / payment page");
  });

  it("maps events to journey stages", () => {
    expect(stageForEvent("page_view", "/")).toBe(0);
    expect(stageForEvent("page_view", "/menu")).toBe(1);
    expect(stageForEvent("product_view", "/products/x")).toBe(1);
    expect(stageForEvent("add_to_cart", "/menu")).toBe(2);
    expect(stageForEvent("checkout_error", "/checkout")).toBe(3);
    expect(stageForEvent("order_placed", "/checkout")).toBe(4);
  });

  it("rejects unknown events and oversized batches", () => {
    const base = {
      visitorId: "11111111-2222-3333-4444-555555555555",
      sessionId: "66666666-7777-8888-9999-000000000000",
      sentAt: 1000,
      events: [{ name: "page_view", path: "/", at: 1000 }],
    };
    expect(siteEventBatchSchema.safeParse(base).success).toBe(true);
    expect(
      siteEventBatchSchema.safeParse({ ...base, events: [{ name: "delete_db", path: "/", at: 1 }] }).success,
    ).toBe(false);
    expect(
      siteEventBatchSchema.safeParse({ ...base, events: Array.from({ length: 26 }, () => base.events[0]) }).success,
    ).toBe(false);
    expect(siteEventBatchSchema.safeParse({ ...base, visitorId: "x" }).success).toBe(false);
  });
});
