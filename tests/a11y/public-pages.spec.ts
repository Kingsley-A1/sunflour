import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/menu", "/cart", "/checkout", "/reviews"];

test.describe("public accessibility smoke checks", () => {
  for (const route of publicRoutes) {
    test(`${route} has no critical axe violations`, async ({ page }) => {
      await page.goto(route);

      const results = await new AxeBuilder({ page }).analyze();
      const criticalViolations = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      );

      expect(criticalViolations).toEqual([]);
    });
  }
});
