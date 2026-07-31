import { expect, test } from "@playwright/test";

test("homepage promotions show three desktop banners, rotate, and swipe without controls", async ({
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
  const promotions = carousel.getByRole("link");
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
  await expect(carousel.getByRole("button")).toHaveCount(0);

  const frameBounds = await frame.boundingBox();
  const firstBounds = await promotions.nth(0).boundingBox();
  const thirdBounds = await promotions.nth(2).boundingBox();
  expect(frameBounds).not.toBeNull();
  expect(firstBounds).not.toBeNull();
  expect(thirdBounds).not.toBeNull();
  expect((firstBounds?.width ?? 0) / (firstBounds?.height ?? 1)).toBeCloseTo(21 / 9, 1);
  expect(firstBounds?.x).toBeGreaterThanOrEqual(frameBounds?.x ?? 0);
  expect((thirdBounds?.x ?? 0) + (thirdBounds?.width ?? 0)).toBeLessThanOrEqual(
    (frameBounds?.x ?? 0) + (frameBounds?.width ?? 0) + 1,
  );

  await expect(track).toHaveAttribute("style", /translateX\(-?0%\)/);
  await expect
    .poll(async () => track.getAttribute("style"), { timeout: 3_500 })
    .toMatch(/translateX\(-33\.333/);

  await firstPromotion.focus();
  const transformBeforeSwipe = await track.getAttribute("style");
  const swipeStartX = (frameBounds?.x ?? 0) + (frameBounds?.width ?? 0) * 0.75;
  const swipeY = (frameBounds?.y ?? 0) + (frameBounds?.height ?? 0) / 2;
  await page.mouse.move(swipeStartX, swipeY);
  await page.mouse.down();
  await page.mouse.move(swipeStartX - 160, swipeY, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => track.getAttribute("style")).not.toBe(transformBeforeSwipe);
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
  await expect(carousel.getByRole("button")).toHaveCount(0);
});

test("public route changes open at the top of the destination page", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.body.scrollHeight > window.innerHeight),
    )
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.locator('header a[href="/about"]').click();
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
