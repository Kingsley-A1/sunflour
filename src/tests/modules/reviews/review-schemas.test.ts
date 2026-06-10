import { describe, expect, it } from "vitest";
import { publicReviewCreateSchema } from "@/server/modules/reviews/review-schemas";

describe("review schemas", () => {
  it("accepts plain-text public reviews and normalizes whitespace", () => {
    const parsed = publicReviewCreateSchema.parse({
      customerName: "  Ada   Baker  ",
      rating: 5,
      comment: "  Fresh bread   and warm service.  ",
    });

    expect(parsed).toMatchObject({
      customerName: "Ada Baker",
      comment: "Fresh bread and warm service.",
      rating: 5,
    });
  });

  it("rejects html in public review names and comments", () => {
    expect(() =>
      publicReviewCreateSchema.parse({
        customerName: "<script>alert(1)</script>",
        rating: 5,
        comment: "Fresh bread and warm service.",
      }),
    ).toThrow();

    expect(() =>
      publicReviewCreateSchema.parse({
        customerName: "Ada Baker",
        rating: 5,
        comment: "Fresh bread <img src=x onerror=alert(1)> and service.",
      }),
    ).toThrow();
  });
});
