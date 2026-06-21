import { describe, expect, it } from "vitest";
import { shouldStartNavigation } from "@/components/ui/page-loading-line";

const currentHref = "https://sunflour.example/";

describe("page loading line", () => {
  it("starts only for internal route navigation", () => {
    expect(
      shouldStartNavigation({
        button: 0,
        currentHref,
        destinationHref: "/menu",
      }),
    ).toBe(true);
    expect(
      shouldStartNavigation({
        button: 0,
        currentHref,
        destinationHref: "https://example.com/menu",
      }),
    ).toBe(false);
  });

  it("ignores modified clicks and same-page anchors", () => {
    expect(
      shouldStartNavigation({
        button: 0,
        ctrlKey: true,
        currentHref,
        destinationHref: "/menu",
      }),
    ).toBe(false);
    expect(
      shouldStartNavigation({
        button: 0,
        currentHref,
        destinationHref: "/#menu",
      }),
    ).toBe(false);
  });
});
