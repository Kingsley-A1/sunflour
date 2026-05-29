import { expect, test } from "@playwright/test";

test.describe("public customer smoke flow", () => {
  test("homepage, menu, cart, checkout, and reviews are reachable", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /menu/i }).first()).toBeVisible();

    await page.goto("/menu");
    await expect(page.getByRole("heading", { name: /menu/i })).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText(/cart/i).first()).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByText(/no items to checkout/i)).toBeVisible();

    await page.goto("/reviews");
    await expect(page.getByRole("heading", { name: /review/i }).first()).toBeVisible();
  });
});
