import { beforeEach, describe, expect, it } from "vitest";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import {
  checkRateLimit,
  clearRateLimitBuckets,
  enforceRateLimit,
} from "@/server/lib/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    clearRateLimitBuckets();
  });

  it("tracks requests per key inside the configured window", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");

    expect(
      checkRateLimit({
        key: "checkout:ip",
        limit: 2,
        windowMs: 60_000,
        now,
      }),
    ).toMatchObject({
      allowed: true,
      remaining: 1,
    });
    expect(
      checkRateLimit({
        key: "checkout:ip",
        limit: 2,
        windowMs: 60_000,
        now,
      }),
    ).toMatchObject({
      allowed: true,
      remaining: 0,
    });
    expect(
      checkRateLimit({
        key: "checkout:ip",
        limit: 2,
        windowMs: 60_000,
        now,
      }),
    ).toMatchObject({
      allowed: false,
      remaining: 0,
    });
  });

  it("throws a standard API error when limit is exceeded", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");

    enforceRateLimit({
      key: "review:ip",
      limit: 1,
      windowMs: 60_000,
      now,
    });

    expect(() =>
      enforceRateLimit({
        key: "review:ip",
        limit: 1,
        windowMs: 60_000,
        now,
      }),
    ).toThrow("Too many requests. Try again shortly.");

    try {
      enforceRateLimit({
        key: "review:ip",
        limit: 1,
        windowMs: 60_000,
        now,
      });
    } catch (error) {
      expect(error).toMatchObject({
        code: ERROR_CODES.RATE_LIMITED,
        status: 429,
      });
    }
  });
});
