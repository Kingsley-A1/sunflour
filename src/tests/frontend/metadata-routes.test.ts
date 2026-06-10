import { describe, expect, it, vi } from "vitest";

describe("metadata routes", () => {
  it("keeps admin and transactional routes out of robots indexing", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sunflour.test");
    const { default: robots } = await import("@/app/robots");

    const metadata = robots();

    expect(metadata.sitemap).toBe("https://sunflour.test/sitemap.xml");
    expect(metadata.rules).toMatchObject({
      userAgent: "*",
      disallow: expect.arrayContaining(["/admin", "/api", "/checkout"]),
    });

    vi.unstubAllEnvs();
  });

  it("publishes core public pages in the sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sunflour.test/");
    const { default: sitemap } = await import("@/app/sitemap");

    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        "https://sunflour.test/",
        "https://sunflour.test/menu",
        "https://sunflour.test/reviews",
      ]),
    );

    vi.unstubAllEnvs();
  });
});
