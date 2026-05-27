import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  EmailOutboxStatus,
  EmailTemplateKey,
  UserRole,
} from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/rbac";
import {
  getEmailTemplatesForAdmin,
  processEmailOutbox,
  queueManualEmail,
  retryFailedEmail,
  upsertEmailTemplateForAdmin,
} from "@/server/modules/email";
import { POST as processOutboxRoute } from "@/app/api/v1/admin/email/outbox/process/route";
import { POST as retryEmailRoute } from "@/app/api/v1/admin/email/outbox/[id]/retry/route";
import { POST as manualEmailRoute } from "@/app/api/v1/admin/email/manual/route";
import { GET as getTemplatesRoute } from "@/app/api/v1/admin/email/templates/route";
import { PATCH as patchTemplateRoute } from "@/app/api/v1/admin/email/templates/[key]/route";
import type { ApiErrorBody, ApiSuccess } from "@/server/lib/api/response";

vi.mock("@/server/auth/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/modules/email", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/modules/email")>(
      "@/server/modules/email",
    );

  return {
    ...actual,
    getEmailTemplatesForAdmin: vi.fn(),
    processEmailOutbox: vi.fn(),
    queueManualEmail: vi.fn(),
    retryFailedEmail: vi.fn(),
    upsertEmailTemplateForAdmin: vi.fn(),
  };
});

const mockedRequireRole = vi.mocked(requireRole);
const mockedGetEmailTemplatesForAdmin = vi.mocked(getEmailTemplatesForAdmin);
const mockedProcessEmailOutbox = vi.mocked(processEmailOutbox);
const mockedQueueManualEmail = vi.mocked(queueManualEmail);
const mockedRetryFailedEmail = vi.mocked(retryFailedEmail);
const mockedUpsertEmailTemplateForAdmin = vi.mocked(upsertEmailTemplateForAdmin);

const timestamp = new Date("2026-01-01T00:00:00.000Z");
const superAdmin = {
  id: "super_1",
  email: "owner@example.com",
  name: null,
  image: null,
  role: UserRole.SUPER_ADMIN,
};

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

function emailOutbox() {
  return {
    id: "email_1",
    orderId: "order_1",
    recipientEmail: "ada@example.com",
    recipientName: "Ada Baker",
    templateKey: EmailTemplateKey.ORDER_CONFIRMATION,
    subjectSnapshot: "Order received",
    htmlSnapshot: "<p>Order received</p>",
    payloadJson: {},
    status: EmailOutboxStatus.QUEUED,
    resendEmailId: null,
    errorMessage: null,
    attemptCount: 0,
    nextAttemptAt: null,
    sentAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("email API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireRole.mockResolvedValue(superAdmin);
  });

  it("processes the email outbox through the admin job endpoint", async () => {
    mockedProcessEmailOutbox.mockResolvedValueOnce({
      processed: 1,
      sent: 1,
      failed: 0,
      results: [
        {
          id: "email_1",
          status: EmailOutboxStatus.SENT,
          errorMessage: null,
        },
      ],
    });

    const response = await processOutboxRoute(
      jsonRequest("http://test/api/v1/admin/email/outbox/process", {
        limit: 5,
      }),
    );
    const body = (await response.json()) as ApiSuccess<{ processed: number }>;

    expect(response.status).toBe(200);
    expect(body.data.processed).toBe(1);
    expect(mockedProcessEmailOutbox).toHaveBeenCalledWith({ limit: 5 });
  });

  it("retries failed email through the retry endpoint", async () => {
    mockedRetryFailedEmail.mockResolvedValueOnce(emailOutbox());

    const response = await retryEmailRoute(
      new Request("http://test/api/v1/admin/email/outbox/email_1/retry", {
        method: "POST",
      }),
      {
        params: Promise.resolve({
          id: "email_1",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(mockedRetryFailedEmail).toHaveBeenCalledWith("email_1");
  });

  it("queues manual admin email through EmailService", async () => {
    mockedQueueManualEmail.mockResolvedValueOnce(emailOutbox());

    const input = {
      templateKey: EmailTemplateKey.PURCHASE_INVOICE,
      recipientEmail: "ada@example.com",
      recipientName: "Ada Baker",
      orderId: "order_1",
      payload: {
        orderNumber: "SFB-20260101-ABC123",
        customerName: "Ada Baker",
        total: 700_000,
        invoiceNumber: "INV-SFB-20260101-ABC123",
        invoiceUrl:
          "https://sunflour.test/api/v1/public/invoices/SFB-20260101-ABC123?token=invoice-token",
      },
    };

    const response = await manualEmailRoute(
      jsonRequest("http://test/api/v1/admin/email/manual", input),
    );

    expect(response.status).toBe(201);
    expect(mockedQueueManualEmail).toHaveBeenCalledWith(input);
  });

  it("rejects invalid manual email template keys before queueing", async () => {
    const response = await manualEmailRoute(
      jsonRequest("http://test/api/v1/admin/email/manual", {
        templateKey: "MARKETING_BLAST",
        recipientEmail: "ada@example.com",
        payload: {},
      }),
    );
    const body = (await response.json()) as ApiErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedQueueManualEmail).not.toHaveBeenCalled();
  });

  it("reads and updates template controls through admin routes", async () => {
    mockedGetEmailTemplatesForAdmin.mockResolvedValueOnce([
      {
        id: null,
        key: EmailTemplateKey.ORDER_CONFIRMATION,
        name: "Order confirmation",
        subject: "Order received",
        bodySchemaOrComponentKey: "order-confirmation-v1",
        isActive: true,
        updatedByUserId: null,
        createdAt: null,
        updatedAt: null,
      },
    ]);
    mockedUpsertEmailTemplateForAdmin.mockResolvedValueOnce({
      id: "template_1",
      key: EmailTemplateKey.ORDER_CONFIRMATION,
      name: "Order confirmation",
      subject: "Order {orderNumber} received",
      bodySchemaOrComponentKey: "order-confirmation-v1",
      isActive: false,
      updatedByUserId: "super_1",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const getResponse = await getTemplatesRoute();
    const patchResponse = await patchTemplateRoute(
      jsonRequest(
        "http://test/api/v1/admin/email/templates/ORDER_CONFIRMATION",
        {
          isActive: false,
          subject: "Order {orderNumber} received",
        },
      ),
      {
        params: Promise.resolve({
          key: EmailTemplateKey.ORDER_CONFIRMATION,
        }),
      },
    );

    expect(getResponse.status).toBe(200);
    expect(patchResponse.status).toBe(200);
    expect(mockedUpsertEmailTemplateForAdmin).toHaveBeenCalledWith(
      EmailTemplateKey.ORDER_CONFIRMATION,
      {
        isActive: false,
        subject: "Order {orderNumber} received",
      },
      superAdmin,
    );
  });
});
