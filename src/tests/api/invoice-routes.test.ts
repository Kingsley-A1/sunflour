import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderStatus, PaymentStatus, UserRole } from "@/generated/prisma/enums";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import {
  getAdminInvoice,
  getCustomerInvoice,
  getPublicInvoice,
} from "@/server/modules/invoices";
import { GET as getPublicInvoiceRoute } from "@/app/api/v1/public/invoices/[orderNumber]/route";
import { GET as getCustomerInvoiceRoute } from "@/app/api/v1/customer/orders/[orderNumber]/invoice/route";
import { GET as getAdminInvoiceRoute } from "@/app/api/v1/admin/orders/[orderNumber]/invoice/route";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/invoices", () => ({
  getAdminInvoice: vi.fn(),
  getCustomerInvoice: vi.fn(),
  getPublicInvoice: vi.fn(),
  invoiceOrderNumberParamSchema: {
    safeParse: vi.fn((input) => ({ success: true, data: input })),
  },
  publicInvoiceQuerySchema: {
    safeParse: vi.fn((input) => ({ success: true, data: input })),
  },
}));

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedRequireRole = vi.mocked(requireRole);
const mockedGetAdminInvoice = vi.mocked(getAdminInvoice);
const mockedGetCustomerInvoice = vi.mocked(getCustomerInvoice);
const mockedGetPublicInvoice = vi.mocked(getPublicInvoice);

const createdAt = new Date("2026-01-01T10:00:00.000Z");
const user = {
  id: "user_1",
  email: "ada@example.com",
  name: "Ada",
  image: null,
  role: UserRole.CUSTOMER,
};
const admin = {
  ...user,
  id: "admin_1",
  role: UserRole.MODERATOR,
};

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

describe("invoice API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireAuth.mockResolvedValue(user);
    mockedRequireRole.mockResolvedValue(admin);
    mockedGetPublicInvoice.mockResolvedValue(invoiceResponse());
    mockedGetCustomerInvoice.mockResolvedValue(invoiceResponse());
    mockedGetAdminInvoice.mockResolvedValue(invoiceResponse());
  });

  it("uses order number and token for public invoice access", async () => {
    const response = await getPublicInvoiceRoute(
      new Request(
        "http://test/api/v1/public/invoices/SFB-20260101-ABC123?token=safe-token",
      ),
      {
        params: Promise.resolve({
          orderNumber: "SFB-20260101-ABC123",
        }),
      },
    );
    const body = (await response.json()) as ApiSuccess<{
      invoiceNumber: string;
    }>;

    expect(response.status).toBe(200);
    expect(body.data.invoiceNumber).toBe("INV-SFB-20260101-ABC123");
    expect(mockedGetPublicInvoice).toHaveBeenCalledWith(
      "SFB-20260101-ABC123",
      "safe-token",
    );
  });

  it("requires customer auth for customer invoice access", async () => {
    const response = await getCustomerInvoiceRoute(new Request("http://test"), {
      params: Promise.resolve({
        orderNumber: "SFB-20260101-ABC123",
      }),
    });

    expect(response.status).toBe(200);
    expect(mockedGetCustomerInvoice).toHaveBeenCalledWith(
      "SFB-20260101-ABC123",
      user,
    );
  });

  it("requires admin role for admin invoice access", async () => {
    const response = await getAdminInvoiceRoute(new Request("http://test"), {
      params: Promise.resolve({
        orderNumber: "SFB-20260101-ABC123",
      }),
    });

    expect(response.status).toBe(200);
    expect(mockedRequireRole).toHaveBeenCalled();
    expect(mockedGetAdminInvoice).toHaveBeenCalledWith(
      "SFB-20260101-ABC123",
    );
  });

  it("returns an error for invalid public invoice lookups", async () => {
    mockedGetPublicInvoice.mockRejectedValueOnce(
      new Error("Invoice not found."),
    );

    const response = await getPublicInvoiceRoute(
      new Request(
        "http://test/api/v1/public/invoices/SFB-20260101-ABC123?token=bad-token",
      ),
      {
        params: Promise.resolve({
          orderNumber: "SFB-20260101-ABC123",
        }),
      },
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
  });
});
