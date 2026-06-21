import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

type Slice = {
  name: string;
  route: string;
  ready: (page: Page) => Promise<void>;
};

const slices: Slice[] = [
  {
    name: "public-shell",
    route: "/about",
    ready: async (page) => {
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /fresh bakery ordering/i,
        }),
      ).toBeVisible();
    },
  },
  {
    name: "menu-cards",
    route: "/menu",
    ready: async (page) => {
      await expect(
        page.getByRole("heading", { level: 1, name: /browse sunflour products/i }),
      ).toBeVisible();
    },
  },
  {
    name: "cart-checkout",
    route: "/cart",
    ready: async (page) => {
      await expect(
        page.getByRole("heading", { level: 1, name: /review your order/i }),
      ).toBeVisible();
    },
  },
  {
    name: "account-boundary",
    route: "/account",
    ready: async (page) => {
      await expect(page).toHaveURL(/\/(?:account|sign-in)/);
      await expect(page.locator("main")).toBeVisible();
    },
  },
  {
    name: "admin-access-boundary",
    route: "/admin-register",
    ready: async (page) => {
      await expect(
        page.getByRole("heading", { level: 1, name: /register admin account/i }),
      ).toBeVisible();
    },
  },
];

test.describe("design-system vertical slices", () => {
  for (const slice of slices) {
    test(`${slice.name}: visual baseline and WCAG smoke check`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(slice.route, { waitUntil: "networkidle" });
      await slice.ready(page);

      const results = await new AxeBuilder({ page }).analyze();
      const blockingViolations = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      );

      expect(blockingViolations).toEqual([]);
      await expect(page).toHaveScreenshot(`${slice.name}.png`, {
        animations: "disabled",
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
