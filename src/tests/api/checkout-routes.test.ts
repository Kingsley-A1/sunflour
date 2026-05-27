import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomerType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from "@/generated/prisma/enums";
import type { CustomerType as CustomerTypeValue } from "@/generated/prisma/enums";
import { getOptionalAuth } from "@/server/auth/rbac";
import { createCheckoutOrder } from "@/server/modules/checkout/checkout-service";
import { POST as postCheckoutRoute } from "@/app/api/v1/public/checkout/route";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  getOptionalAuth: vi.fn(),
}));

vi.mock("@/server/modules/checkout/checkout-service", () => ({
  createCheckoutOrder: vi.fn(),
}));

const mockedGetOptionalAuth = vi.mocked(getOptionalAuth);
const mockedCreateCheckoutOrder = vi.mocked(createCheckoutOrder);

const guestCheckoutBody = {
  customer: {
    fullName: "Ada Baker",
    phone: "+234 801 234 5678",
    email: "",
  },
  delivery: {
    method: DeliveryMethod.DELIVERY,
    zoneId: "zone_1",
    address: "12 Bakery Street",
  },
  items: [
    {
      productId: "product_1",
      quantity: 2,
    },
  ],
};

function jsonRequest(
  url: string,
  body: unknown,
  idempotencyKey = "checkout-key-1",
): NextRequest {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
  }) as NextRequest;
}

function checkoutResponse(customerType: CustomerTypeValue = CustomerType.GUEST) {
  return {
    orderNumber: "SFB-20260101-ABC123",
    customerType,
    status: OrderStatus.PENDING_PAYMENT,
    paymentStatus: PaymentStatus.UNPAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    subtotal: 500_000,
    total: 700_000,
    delivery: {
      method: DeliveryMethod.DELIVERY,
      address: "12 Bakery Street",
      zoneId: "zone_1",
      zoneName: "Central Bakery Area",
      baseFee: 150_000,
      surcharge: 50_000,
      totalFee: 200_000,
    },
    items: [
      {
        productName: "Chocolate Cake",
        variantName: null,
        unitPrice: 250_000,
        quantity: 2,
        lineTotal: 500_000,
      },
    ],
    invoiceNumber: "INV-SFB-20260101-ABC123",
    paymentInstruction: "Transfer to Sunflour test account.",
    invoiceUrl: "/orders/SFB-20260101-ABC123/invoice",
    whatsAppProofUrl: "https://wa.me/?text=proof",
    whatsAppProofMessage: "proof",
  };
}

describe("checkout API route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedGetOptionalAuth.mockResolvedValue(null);
    mockedCreateCheckoutOrder.mockResolvedValue(checkoutResponse());
  });

  it("creates a guest checkout order with an idempotency key", async () => {
    const response = await postCheckoutRoute(
      jsonRequest("http://test/api/v1/public/checkout", guestCheckoutBody),
    );
    const body = (await response.json()) as ApiSuccess<{
      orderNumber: string;
      total: number;
    }>;

    expect(response.status).toBe(201);
    expect(body.data.orderNumber).toBe("SFB-20260101-ABC123");
    expect(body.data.total).toBe(700_000);
    expect(mockedCreateCheckoutOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          phone: "+2348012345678",
        }),
      }),
      {
        idempotencyKey: "checkout-key-1",
        user: null,
      },
    );
  });

  it("passes authenticated users into checkout creation", async () => {
    const user = {
      id: "user_1",
      email: "ada@example.com",
      name: "Ada",
      image: null,
      role: UserRole.CUSTOMER,
    };
    mockedGetOptionalAuth.mockResolvedValueOnce(user);
    mockedCreateCheckoutOrder.mockResolvedValueOnce(
      checkoutResponse(CustomerType.AUTHENTICATED),
    );

    const response = await postCheckoutRoute(
      jsonRequest("http://test/api/v1/public/checkout", guestCheckoutBody),
    );

    expect(response.status).toBe(201);
    expect(mockedCreateCheckoutOrder).toHaveBeenCalledWith(
      expect.anything(),
      {
        idempotencyKey: "checkout-key-1",
        user,
      },
    );
  });

  it("rejects client-submitted checkout totals", async () => {
    const response = await postCheckoutRoute(
      jsonRequest("http://test/api/v1/public/checkout", {
        ...guestCheckoutBody,
        total: 1,
      }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedCreateCheckoutOrder).not.toHaveBeenCalled();
  });

  it("rejects invalid phone, address, and item payloads", async () => {
    const response = await postCheckoutRoute(
      jsonRequest("http://test/api/v1/public/checkout", {
        customer: {
          fullName: "Ada Baker",
          phone: "abc",
        },
        delivery: {
          method: DeliveryMethod.DELIVERY,
          zoneId: "zone_1",
        },
        items: [],
      }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedCreateCheckoutOrder).not.toHaveBeenCalled();
  });

  it("requires the idempotency key header", async () => {
    const response = await postCheckoutRoute(
      jsonRequest(
        "http://test/api/v1/public/checkout",
        guestCheckoutBody,
        "",
      ),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedCreateCheckoutOrder).not.toHaveBeenCalled();
  });
});
