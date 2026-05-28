import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomerType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import {
  lookupGuestOrder,
  updateCustomerProfile,
} from "@/server/modules/customers/customer-service";

const mocks = vi.hoisted(() => ({
  orderFindFirst: vi.fn(),
  userUpdate: vi.fn(),
  customerProfileUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    order: {
      findFirst: mocks.orderFindFirst,
    },
    $transaction: mocks.transaction,
  },
}));

const user = {
  id: "user_1",
  email: "ada@example.com",
  name: "Ada",
  image: null,
  role: "CUSTOMER" as const,
};

const customerOrder = {
  orderNumber: "SFB-20260101-ABC123",
  customerType: CustomerType.GUEST,
  customerNameSnapshot: "Ada Baker",
  customerPhoneSnapshot: "+2348012345678",
  customerEmailSnapshot: null,
  deliveryMethod: DeliveryMethod.PICKUP,
  deliveryZoneNameSnapshot: null,
  deliveryAddressSnapshot: null,
  deliveryBaseFeeSnapshot: 0,
  deliverySurchargeSnapshot: 0,
  deliveryTotalFeeSnapshot: 0,
  subtotal: 500_000,
  total: 500_000,
  status: OrderStatus.PENDING_PAYMENT,
  paymentStatus: PaymentStatus.UNPAID,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  paymentInstructionSnapshot: "Transfer to Sunflour.",
  proofWhatsappNumberSnapshot: "2348012345678",
  customerNote: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  cancelledAt: null,
  deliveredAt: null,
  items: [],
  invoice: {
    invoiceNumber: "INV-SFB-20260101-ABC123",
    publicAccessToken: "token_1",
    pdfUrl: null,
    generatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  statusEvents: [],
  _count: {
    items: 0,
  },
};

describe("customer service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        user: {
          update: mocks.userUpdate,
        },
        customerProfile: {
          upsert: mocks.customerProfileUpsert,
        },
      }),
    );
  });

  it("looks up a guest order only when order number and phone match", async () => {
    mocks.orderFindFirst.mockResolvedValueOnce(customerOrder);

    const result = await lookupGuestOrder({
      orderNumber: "SFB-20260101-ABC123",
      phone: "+234 801 234 5678",
    });

    expect(result.orderNumber).toBe("SFB-20260101-ABC123");
    expect(result.invoiceUrl).toContain("token_1");
  });

  it("does not reveal orders when the phone does not match", async () => {
    mocks.orderFindFirst.mockResolvedValueOnce(customerOrder);

    await expect(
      lookupGuestOrder({
        orderNumber: "SFB-20260101-ABC123",
        phone: "2348000000000",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
    });
  });

  it("updates user and customer profile without touching order snapshots", async () => {
    mocks.customerProfileUpsert.mockResolvedValueOnce({
      id: "profile_1",
      userId: "user_1",
      fullName: "Ada Baker",
      phone: "+2348012345678",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await updateCustomerProfile(
      {
        fullName: "Ada Baker",
        phone: "+2348012345678",
      },
      user,
    );

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: "Ada Baker",
          phone: "+2348012345678",
        },
      }),
    );
    expect(mocks.customerProfileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
        },
      }),
    );
  });
});
