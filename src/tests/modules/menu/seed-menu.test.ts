import { describe, expect, it } from "vitest";
import { canonicalProductCategories } from "@/server/modules/menu/seed-menu";

describe("canonical menu seed", () => {
  it("keeps Cakes, Treats, Ice Cream, and Others as separate categories", () => {
    const slugs = canonicalProductCategories.map((category) => category.slug);

    expect(slugs).toEqual(expect.arrayContaining(["cakes", "treats", "ice-cream", "others"]));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).not.toContain("cakes-and-treats");
  });
});
