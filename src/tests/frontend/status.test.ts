import { describe, expect, it } from "vitest";
import { getStatusMeta, paymentStatusMeta } from "@/lib/status";

describe("status metadata", () => {
  it("maps payment status to accessible text and tone", () => {
    expect(paymentStatusMeta.CONFIRMED).toMatchObject({
      label: "Confirmed",
      tone: "success",
    });
  });

  it("falls back for unknown backend statuses", () => {
    expect(getStatusMeta("CUSTOM_BACKEND_STATUS")).toMatchObject({
      label: "Custom backend status",
      tone: "neutral",
    });
  });
});
