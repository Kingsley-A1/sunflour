import { describe, expect, it } from "vitest";
import { adminOrderListQuerySchema } from "@/server/modules/orders/order-schemas";

describe("admin order list query schema", () => {
  it("normalizes blank optional filters instead of rejecting the orders page", () => {
    const result = adminOrderListQuerySchema.parse({
      status: "",
      paymentStatus: "",
      customerType: "",
      orderNumber: "",
      customerPhone: "   ",
      createdFrom: "",
      createdTo: "",
      page: "1",
      pageSize: "25",
    });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
    expect(result.status).toBeUndefined();
    expect(result.orderNumber).toBeUndefined();
    expect(result.customerPhone).toBeUndefined();
  });

  it("still rejects a non-empty invalid status", () => {
    expect(() =>
      adminOrderListQuerySchema.parse({
        status: "UNKNOWN",
        page: "1",
        pageSize: "25",
      }),
    ).toThrow();
  });
});
