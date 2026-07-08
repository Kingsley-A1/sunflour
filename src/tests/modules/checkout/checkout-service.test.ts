import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomerType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import {
  buildIdempotencyRequestHash,
  generateOrderNumber,
} from "@/server/modules/checkout/checkout-ids";
import {
  buildWhatsAppProofMessage,
  buildWhatsAppProofUrl,
} from "@/server/modules/checkout/checkout-payment";
import {
  createCheckoutOrder,
  resolveCheckoutLineItems,
} from "@/server/modules/checkout/checkout-service";
import type { CheckoutCreateInput } from "@/server/modules/checkout/checkout-schemas";

const mocks = vi.hoisted(() => ({
  orderFindUnique: vi.fn(),
  productFindMany: vi.fn(),
  orderCreate: vi.fn(),
  cartDeleteMany: vi.fn(),
  transaction: vi.fn(),
  getDeliveryQuote: vi.fn(),
  getActivePaymentSnapshot: vi.fn(),
  queueOrderConfirmationEmailForOrder: vi.fn(),
  queueAdminNewOrderAlertEmailsForOrder: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    order: {
      findUnique: mocks.orderFindUnique,
    },
    product: {
      findMany: mocks.productFindMany,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/server/modules/delivery/delivery-service", () => ({
  getDeliveryQuote: mocks.getDeliveryQuote,
}));

vi.mock("@/server/modules/payments/payment-service", () => ({
  getActivePaymentSnapshot: mocks.getActivePaymentSnapshot,
}));

vi.mock("@/server/modules/email", () => ({
  queueAdminNewOrderAlertEmailsForOrder:
    mocks.queueAdminNewOrderAlertEmailsForOrder,
  queueOrderConfirmationEmailForOrder:
    mocks.queueOrderConfirmationEmailForOrder,
}));

vi.mock("@/server/config/env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://sunflour.test",
  }),
}));

const now = new Date("2026-01-01T17:00:00.000Z");

const checkoutInput: CheckoutCreateInput = {
  customer: {
    fullName: "Ada Baker",
    phone: "+2348012345678",
    email: "ada@example.com",
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

function activeProduct(overrides = {}) {
  return {
    id: "product_1",
    categoryId: "category_1",
    name: "Chocolate Cake",
    slug: "chocolate-cake",
    description: null,
    basePrice: 250_000,
    status: ProductStatus.ACTIVE,
    showWhenOutOfStock: true,
    isFeatured: false,
    isPopular: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    category: {
      isActive: true,
    },
    variants: [],
    ...overrides,
  };
}

function checkoutOrder(overrides = {}) {
  return {
    id: "order_1",
    orderNumber: "SFB-20260101-ABC123",
    idempotencyKey: "checkout-key-1",
    idempotencyRequestHash: buildIdempotencyRequestHash(checkoutInput),
    userId: null,
    customerType: CustomerType.GUEST,
    customerNameSnapshot: checkoutInput.customer.fullName,
    customerPhoneSnapshot: checkoutInput.customer.phone,
    customerEmailSnapshot: checkoutInput.customer.email,
    deliveryMethod: checkoutInput.delivery.method,
    deliveryAddressSnapshot: checkoutInput.delivery.address,
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
    paymentInstructionSnapshot:
      "Bank Name: Moniepoint\nAccount Name: Sunflour Bakery\nAccount Number: 1234567890\n\nTransfer to Sunflour test account.",
    proofWhatsappNumberSnapshot: "2348012345678",
    customerNote: null,
    adminNote: null,
    createdAt: now,
    updatedAt: now,
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
        createdAt: now,
      },
    ],
    invoice: {
      invoiceNumber: "INV-SFB-20260101-ABC123",
      publicAccessToken: "invoice-token-1",
    },
    ...overrides,
  };
}

describe("checkout service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        order: {
          create: mocks.orderCreate,
        },
        cart: {
          deleteMany: mocks.cartDeleteMany,
        },
      }),
    );
    mocks.getDeliveryQuote.mockResolvedValue({
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryZone: {
        id: "zone_1",
        name: "Central Bakery Area",
        slug: "central-bakery-area",
      },
      baseFee: 150_000,
      surcharge: 50_000,
      totalFee: 200_000,
      appliedSurchargeRules: [],
      quotedAt: now.toISOString(),
    });
    mocks.getActivePaymentSnapshot.mockResolvedValue({
      paymentInstructionSnapshot:
        "Bank Name: Moniepoint\nAccount Name: Sunflour Bakery\nAccount Number: 1234567890\n\nTransfer to Sunflour test account.",
      proofWhatsappNumberSnapshot: "2348012345678",
    });
    mocks.queueOrderConfirmationEmailForOrder.mockResolvedValue(null);
    mocks.queueAdminNewOrderAlertEmailsForOrder.mockResolvedValue([]);
  });

  it("creates a guest order with server-calculated product and delivery totals", async () => {
    mocks.orderFindUnique.mockResolvedValueOnce(null);
    mocks.productFindMany.mockResolvedValueOnce([activeProduct()]);
    mocks.orderCreate.mockImplementationOnce(async (args) =>
      checkoutOrder({
        orderNumber: args.data.orderNumber,
        idempotencyKey: args.data.idempotencyKey,
        idempotencyRequestHash: args.data.idempotencyRequestHash,
      }),
    );

    const response = await createCheckoutOrder(checkoutInput, {
      idempotencyKey: "checkout-key-1",
      now,
    });

    expect(response.subtotal).toBe(500_000);
    expect(response.delivery.totalFee).toBe(200_000);
    expect(response.total).toBe(700_000);
    expect(response.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(response.paymentStatus).toBe(PaymentStatus.UNPAID);
    expect(response.invoiceUrl).toContain(response.orderNumber);
    expect(decodeURIComponent(response.whatsAppProofUrl)).toContain(
      response.orderNumber,
    );
    expect(mocks.orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerType: CustomerType.GUEST,
          subtotal: 500_000,
          total: 700_000,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentInstructionSnapshot: expect.stringContaining("Moniepoint"),
          proofWhatsappNumberSnapshot: "2348012345678",
          invoice: {
            create: expect.objectContaining({
              invoiceNumber: expect.stringMatching(
                /^INV-SFB-\d{8}-[A-Z2-9]{6}$/,
              ),
              publicAccessToken: expect.any(String),
              htmlSnapshot: expect.stringContaining("Chocolate Cake"),
            }),
          },
        }),
      }),
    );
    expect(mocks.queueOrderConfirmationEmailForOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNumber: response.orderNumber,
        customerEmailSnapshot: "ada@example.com",
      }),
    );
    expect(mocks.queueAdminNewOrderAlertEmailsForOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNumber: response.orderNumber,
      }),
    );
  });

  it("creates an authenticated order and clears the saved cart", async () => {
    mocks.orderFindUnique.mockResolvedValueOnce(null);
    mocks.productFindMany.mockResolvedValueOnce([activeProduct()]);
    mocks.orderCreate.mockImplementationOnce(async (args) =>
      checkoutOrder({
        userId: "user_1",
        customerType: CustomerType.AUTHENTICATED,
        orderNumber: args.data.orderNumber,
      }),
    );

    const response = await createCheckoutOrder(checkoutInput, {
      idempotencyKey: "checkout-key-2",
      now,
      user: {
        id: "user_1",
        email: "ada@example.com",
        name: "Ada",
        image: null,
        role: UserRole.CUSTOMER,
      },
    });

    expect(response.customerType).toBe(CustomerType.AUTHENTICATED);
    expect(mocks.cartDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
      },
    });
  });

  it("does not fail checkout when email queueing fails", async () => {
    mocks.orderFindUnique.mockResolvedValueOnce(null);
    mocks.productFindMany.mockResolvedValueOnce([activeProduct()]);
    mocks.orderCreate.mockImplementationOnce(async (args) =>
      checkoutOrder({
        orderNumber: args.data.orderNumber,
      }),
    );
    mocks.queueOrderConfirmationEmailForOrder.mockRejectedValueOnce(
      new Error("email outbox unavailable"),
    );

    const response = await createCheckoutOrder(checkoutInput, {
      idempotencyKey: "checkout-key-3",
      now,
    });

    expect(response.orderNumber).toMatch(/^SFB-/);
    expect(mocks.queueOrderConfirmationEmailForOrder).toHaveBeenCalledTimes(1);
  });

  it("returns the existing order for duplicate idempotent requests", async () => {
    mocks.orderFindUnique.mockResolvedValueOnce(checkoutOrder());

    const response = await createCheckoutOrder(checkoutInput, {
      idempotencyKey: "checkout-key-1",
      now,
    });

    expect(response.orderNumber).toBe("SFB-20260101-ABC123");
    expect(mocks.productFindMany).not.toHaveBeenCalled();
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });

  it("rejects a reused idempotency key with a different request hash", async () => {
    mocks.orderFindUnique.mockResolvedValueOnce(
      checkoutOrder({
        idempotencyRequestHash: "different-request",
      }),
    );

    await expect(
      createCheckoutOrder(checkoutInput, {
        idempotencyKey: "checkout-key-1",
        now,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.IDEMPOTENCY_CONFLICT,
      status: 409,
    });
  });

  it("rejects hidden and out-of-stock products during checkout resolution", () => {
    expect(() =>
      resolveCheckoutLineItems(checkoutInput.items, [
        activeProduct({ status: ProductStatus.HIDDEN }),
      ]),
    ).toThrow("This item is not available for ordering.");

    expect(() =>
      resolveCheckoutLineItems(checkoutInput.items, [
        activeProduct({ status: ProductStatus.OUT_OF_STOCK }),
      ]),
    ).toThrow("This item is not available for ordering.");
  });

  it("generates customer-safe unique order numbers", () => {
    const generated = new Set(
      Array.from({ length: 100 }, () => generateOrderNumber(now)),
    );

    expect(generated.size).toBe(100);
    expect([...generated][0]).toMatch(/^SFB-20260101-[A-Z2-9]{6}$/);
  });

  it("builds WhatsApp proof messages with order number and amount paid", () => {
    const message = buildWhatsAppProofMessage({
      orderNumber: "SFB-20260101-ABC123",
      customerName: "Ada Baker",
      amountPaid: 500_000,
    });
    const url = buildWhatsAppProofUrl(message, "2348012345678");

    expect(message).toContain("SFB-20260101-ABC123");
    expect(message).toContain("Ada Baker");
    expect(message).toContain("5,000");
    expect(url).toContain("https://wa.me/2348012345678");
  });
});
