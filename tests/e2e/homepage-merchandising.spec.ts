import { expect, test } from "@playwright/test";

test("homepage promotions rotate, pause, and preserve the 21:9 frame", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/", { waitUntil: "networkidle" });

  const carousel = page.getByRole("region", {
    name: "Featured Sunflour products",
  });
  const firstPromotion = carousel.getByRole("link", {
    name: "View Double Protein Burger",
  });
  const track = carousel.getByTestId("homepage-carousel-track");
  const frame = carousel.getByTestId("homepage-carousel-frame");

  await expect(carousel).toBeVisible();
  await expect(firstPromotion).toHaveAttribute(
    "href",
    "/menu?view=products&query=burger",
  );

  const bounds = await frame.boundingBox();
  expect(bounds).not.toBeNull();
  expect((bounds?.width ?? 0) / (bounds?.height ?? 1)).toBeCloseTo(21 / 9, 1);

  await carousel
    .getByRole("button", { name: "Pause carousel rotation" })
    .click();
  await carousel
    .getByRole("button", { name: "Show Double Protein Burger" })
    .click();
  await expect(track).toHaveAttribute("style", /translateX\(-?0%\)/);
  await carousel
    .getByRole("button", { name: "Resume carousel rotation" })
    .click();
  await page.getByRole("heading", { level: 1 }).hover();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect
    .poll(async () => track.getAttribute("style"), { timeout: 3_500 })
    .toContain("translateX(-100%)");

  await carousel.getByRole("button", { name: "Pause carousel rotation" }).click();
  const pausedTransform = await track.getAttribute("style");
  await page.waitForTimeout(2_200);
  expect(await track.getAttribute("style")).toBe(pausedTransform);
  expect(browserErrors).toEqual([]);
});

test("homepage promotions stay usable without horizontal overflow on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const carousel = page.getByRole("region", {
    name: "Featured Sunflour products",
  });
  const frame = carousel.getByTestId("homepage-carousel-frame");
  await expect(frame).toBeVisible();

  const bounds = await frame.boundingBox();
  expect(bounds).not.toBeNull();
  expect((bounds?.width ?? 0) / (bounds?.height ?? 1)).toBeCloseTo(21 / 9, 1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await expect(
    carousel.getByRole("button", { name: "Show next promotion" }),
  ).toBeVisible();
});
