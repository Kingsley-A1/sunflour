import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/seo/site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses an explicitly configured custom domain", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.sunflour.test/");
    expect(getSiteUrl()).toBe("https://shop.sunflour.test");
  });

  it("does not publish a Vercel project hostname in canonical social metadata", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_APP_URL",
      "https://sunflour-five.vercel.app",
    );
    expect(getSiteUrl()).toBe("https://www.sunflourbakery.ng");
  });

  it("falls back to the public production domain", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getSiteUrl()).toBe("https://www.sunflourbakery.ng");
  });
});
