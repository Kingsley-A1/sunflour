import { describe, expect, it } from "vitest";
import {
  buildCheckoutAttemptSignature,
  createCheckoutIdempotencyKey,
} from "@/lib/checkout/idempotency";

describe("checkout idempotency helpers", () => {
  it("creates checkout-scoped idempotency keys", () => {
    expect(createCheckoutIdempotencyKey(() => "abc-123")).toBe(
      "checkout_abc-123",
    );
  });

  it("keeps the same attempt signature when cart contents do not change", () => {
    const items = [
      {
        productId: "bread",
        quantity: 2,
      },
      {
        productId: "cake",
        variantId: "small",
        quantity: 1,
      },
    ];

    expect(buildCheckoutAttemptSignature(items)).toBe(
      buildCheckoutAttemptSignature([...items]),
    );
  });

  it("changes the attempt signature when quantities change", () => {
    expect(
      buildCheckoutAttemptSignature([
        {
          productId: "bread",
          quantity: 1,
        },
      ]),
    ).not.toBe(
      buildCheckoutAttemptSignature([
        {
          productId: "bread",
          quantity: 2,
        },
      ]),
    );
  });
});
