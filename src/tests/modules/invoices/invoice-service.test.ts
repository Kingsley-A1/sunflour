import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomerType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import {
  createInvoiceForOrder,
  getCustomerInvoice,
  getPublicInvoice,
} from "@/server/modules/invoices";

const mocks = vi.hoisted(() => ({
  invoiceCreate: vi.fn(),
  invoiceFindFirst: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    invoice: {
      create: mocks.invoiceCreate,
      findFirst: mocks.invoiceFindFirst,
    },
  },
}));

const createdAt = new Date("2026-01-01T10:00:00.000Z");

function orderForInvoice() {
  return {
    id: "order_1",
    orderNumber: "SFB-20260101-ABC123",
    idempotencyKey: "checkout-key-1",
    idempotencyRequestHash: "request-hash",
    userId: "user_1",
    customerType: CustomerType.AUTHENTICATED,
    customerNameSnapshot: "Ada Baker",
    customerPhoneSnapshot: "+2348012345678",
    customerEmailSnapshot: "ada@example.com",
    deliveryMethod: DeliveryMethod.DELIVERY,
    deliveryAddressSnapshot: "12 Bakery Street",
    deliveryZoneId: "zone_1",
    deliveryZoneNameSnapshot: "Central Bakery Area",
    deliveryBaseFeeSnapshot: 150_000,
    deliverySurchargeSnapshot: 50_000,
    deliveryTotalFeeSnapshot: 200_000,
    subtotal: 500_000,
    total: 700_000,
    status: OrderStatus.PENDING_PAYMENT,
    paymentStatus: PaymentStatus.UNPAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentInstructionSnapshot: "Bank Name: Moniepoint",
    proofWhatsappNumberSnapshot: "2348012345678",
    customerNote: null,
    adminNote: null,
    createdAt,
    updatedAt: createdAt,
    cancelledAt: null,
    deliveredAt: null,
    items: [
      {
        id: "order_item_1",
        orderId: "order_1",
        productId: "product_1",
        variantId: null,
        productNameSnapshot: "Chocolate Cake",
        variantNameSnapshot: null,
        unitPriceSnapshot: 250_000,
        quantity: 2,
        lineTotal: 500_000,
        createdAt,
      },
    ],
  };
}

function invoiceResponse() {
  return {
    id: "invoice_1",
    invoiceNumber: "INV-SFB-20260101-ABC123",
    htmlSnapshot: "<html>invoice</html>",
    pdfUrl: null,
    generatedAt: createdAt,
    createdAt,
    order: {
      orderNumber: "SFB-20260101-ABC123",
      customerNameSnapshot: "Ada Baker",
      customerPhoneSnapshot: "+2348012345678",
      customerEmailSnapshot: "ada@example.com",
      subtotal: 500_000,
      total: 700_000,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.UNPAID,
    },
  };
}

describe("invoice service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates invoice snapshot records from completed order snapshots", async () => {
    mocks.invoiceCreate.mockResolvedValueOnce(invoiceResponse());

    const result = await createInvoiceForOrder(orderForInvoice());

    expect(result.invoice.invoiceNumber).toBe("INV-SFB-20260101-ABC123");
    expect(result.publicAccessToken).toEqual(expect.any(String));
    expect(mocks.invoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "order_1",
          invoiceNumber: "INV-SFB-20260101-ABC123",
          publicAccessToken: expect.any(String),
          htmlSnapshot: expect.stringContaining("Chocolate Cake"),
        }),
      }),
    );
  });

  it("requires the public invoice access token", async () => {
    await expect(
      getPublicInvoice("SFB-20260101-ABC123", undefined),
    ).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: 404,
    });
    expect(mocks.invoiceFindFirst).not.toHaveBeenCalled();
  });

  it("returns public invoice only when order number and token match", async () => {
    mocks.invoiceFindFirst.mockResolvedValueOnce(invoiceResponse());

    const invoice = await getPublicInvoice(
      "SFB-20260101-ABC123",
      "safe-token",
    );

    expect(invoice.invoiceNumber).toBe("INV-SFB-20260101-ABC123");
    expect(mocks.invoiceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          publicAccessToken: "safe-token",
          order: {
            orderNumber: "SFB-20260101-ABC123",
          },
        },
      }),
    );
  });

  it("rejects authenticated customers from another customer's invoice", async () => {
    mocks.invoiceFindFirst.mockResolvedValueOnce(null);

    await expect(
      getCustomerInvoice("SFB-20260101-ABC123", {
        id: "other_user",
        email: "other@example.com",
        name: null,
        image: null,
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: 403,
    });
  });
});
