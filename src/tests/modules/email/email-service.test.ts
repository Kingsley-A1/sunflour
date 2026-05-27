import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  EmailOutboxStatus,
  EmailTemplateKey,
  OrderStatus,
} from "@/generated/prisma/enums";
import {
  queueAppreciationAfterDeliveryEmail,
  queueEmail,
  queueOrderConfirmationEmailForOrder,
  retryFailedEmail,
  sendQueuedEmail,
} from "@/server/modules/email/email-service";
import { sendEmailWithResend } from "@/server/modules/email/resend-client";

const mocks = vi.hoisted(() => ({
  emailTemplateFindUnique: vi.fn(),
  emailOutboxCreate: vi.fn(),
  emailOutboxFindFirst: vi.fn(),
  emailOutboxFindUnique: vi.fn(),
  emailOutboxUpdate: vi.fn(),
  sendEmailWithResend: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    emailTemplate: {
      findUnique: mocks.emailTemplateFindUnique,
    },
    emailOutbox: {
      create: mocks.emailOutboxCreate,
      findFirst: mocks.emailOutboxFindFirst,
      findUnique: mocks.emailOutboxFindUnique,
      update: mocks.emailOutboxUpdate,
    },
  },
}));

vi.mock("@/server/modules/email/resend-client", () => ({
  sendEmailWithResend: mocks.sendEmailWithResend,
}));

vi.mock("@/server/config/env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://sunflour.test",
    ADMIN_ORDER_ALERT_EMAILS: "",
    EMAIL_OUTBOX_BATCH_SIZE: 10,
  }),
}));

const mockedSendEmailWithResend = vi.mocked(sendEmailWithResend);
const now = new Date("2026-01-01T12:00:00.000Z");

function order(overrides = {}) {
  return {
    id: "order_1",
    orderNumber: "SFB-20260101-ABC123",
    customerNameSnapshot: "Ada Baker",
    customerPhoneSnapshot: "+2348012345678",
    customerEmailSnapshot: "ada@example.com",
    total: 700_000,
    status: OrderStatus.PENDING_PAYMENT,
    deliveredAt: null,
    paymentInstructionSnapshot: "Transfer to Sunflour Bakery.",
    invoice: {
      invoiceNumber: "INV-SFB-20260101-ABC123",
      publicAccessToken: "invoice-token",
    },
    ...overrides,
  };
}

function outbox(overrides = {}) {
  return {
    id: "email_1",
    orderId: "order_1",
    recipientEmail: "ada@example.com",
    recipientName: "Ada Baker",
    templateKey: EmailTemplateKey.ORDER_CONFIRMATION,
    subjectSnapshot: "Order SFB-20260101-ABC123 received",
    htmlSnapshot: "<p>Order SFB-20260101-ABC123</p>",
    payloadJson: {},
    status: EmailOutboxStatus.QUEUED,
    resendEmailId: null,
    errorMessage: null,
    attemptCount: 0,
    nextAttemptAt: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("email service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.emailTemplateFindUnique.mockResolvedValue(null);
    mocks.emailOutboxCreate.mockImplementation(
      async (args: { data: Record<string, unknown> }) =>
        outbox({
          orderId: args.data.orderId,
          recipientEmail: args.data.recipientEmail,
          recipientName: args.data.recipientName,
          templateKey: args.data.templateKey,
          subjectSnapshot: args.data.subjectSnapshot,
          htmlSnapshot: args.data.htmlSnapshot,
          payloadJson: args.data.payloadJson,
          status: args.data.status,
          errorMessage: args.data.errorMessage,
        }),
    );
  });

  it("queues order confirmation only when the order has customer email", async () => {
    const withoutEmail = await queueOrderConfirmationEmailForOrder(
      order({
        customerEmailSnapshot: null,
      }),
    );

    expect(withoutEmail).toBeNull();
    expect(mocks.emailOutboxCreate).not.toHaveBeenCalled();

    const queued = await queueOrderConfirmationEmailForOrder(order());

    expect(queued?.status).toBe(EmailOutboxStatus.QUEUED);
    expect(mocks.emailOutboxCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientEmail: "ada@example.com",
          templateKey: EmailTemplateKey.ORDER_CONFIRMATION,
          status: EmailOutboxStatus.QUEUED,
        }),
      }),
    );
  });

  it("creates skipped outbox records when a template is disabled", async () => {
    mocks.emailTemplateFindUnique.mockResolvedValueOnce({
      subject: "Disabled subject",
      isActive: false,
    });

    const queued = await queueEmail({
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
    });

    expect(queued.status).toBe(EmailOutboxStatus.SKIPPED);
    expect(queued.errorMessage).toBe("Email template is disabled.");
  });

  it("marks failed sends and allows retry", async () => {
    mocks.emailOutboxFindUnique.mockResolvedValueOnce(outbox());
    mockedSendEmailWithResend.mockRejectedValueOnce(
      new Error("Resend unavailable"),
    );
    mocks.emailOutboxUpdate.mockImplementationOnce(
      async (args: { data: Record<string, unknown> }) =>
        outbox({
          status: args.data.status,
          errorMessage: args.data.errorMessage,
          attemptCount: 1,
          nextAttemptAt: args.data.nextAttemptAt,
        }),
    );

    const failed = await sendQueuedEmail("email_1");

    expect(failed.ok).toBe(false);
    expect(failed.outbox.status).toBe(EmailOutboxStatus.FAILED);
    expect(failed.outbox.errorMessage).toBe("Resend unavailable");

    mocks.emailOutboxFindUnique.mockResolvedValueOnce(
      outbox({
        status: EmailOutboxStatus.FAILED,
        errorMessage: "Resend unavailable",
        attemptCount: 1,
      }),
    );
    mocks.emailOutboxUpdate.mockImplementationOnce(
      async (args: { data: Record<string, unknown> }) =>
        outbox({
          status: args.data.status,
          errorMessage: args.data.errorMessage,
          nextAttemptAt: args.data.nextAttemptAt,
        }),
    );

    const retried = await retryFailedEmail("email_1");

    expect(retried.status).toBe(EmailOutboxStatus.QUEUED);
    expect(retried.errorMessage).toBeNull();
  });

  it("queues appreciation email once after delivery", async () => {
    const undelivered = await queueAppreciationAfterDeliveryEmail(order());

    expect(undelivered).toBeNull();
    expect(mocks.emailOutboxFindFirst).not.toHaveBeenCalled();

    mocks.emailOutboxFindFirst.mockResolvedValueOnce(
      outbox({
        templateKey: EmailTemplateKey.APPRECIATION_AFTER_DELIVERY,
        status: EmailOutboxStatus.SENT,
      }),
    );

    const delivered = await queueAppreciationAfterDeliveryEmail(
      order({
        status: OrderStatus.DELIVERED,
        deliveredAt: now,
      }),
    );

    expect(delivered?.templateKey).toBe(
      EmailTemplateKey.APPRECIATION_AFTER_DELIVERY,
    );
    expect(mocks.emailOutboxCreate).not.toHaveBeenCalled();
  });
});
