import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  EmailOutboxStatus,
  EmailTemplateKey,
  OrderStatus,
} from "@/generated/prisma/enums";
import {
  queueAppreciationAfterDeliveryEmail,
  queueAdminNewOrderAlertEmailsForOrder,
  queueEmail,
  queueOrderConfirmationEmailForOrder,
  processEmailOutbox,
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
  emailOutboxUpdateMany: vi.fn(),
  emailOutboxFindMany: vi.fn(),
  sendEmailWithResend: vi.fn(),
  adminOrderAlertEmails: "",
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
      updateMany: mocks.emailOutboxUpdateMany,
      findMany: mocks.emailOutboxFindMany,
    },
  },
}));

vi.mock("@/server/modules/email/resend-client", () => ({
  sendEmailWithResend: mocks.sendEmailWithResend,
}));

vi.mock("@/server/config/env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://sunflour.test",
    ADMIN_ORDER_ALERT_EMAILS: mocks.adminOrderAlertEmails,
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
    subtotal: 500_000,
    total: 700_000,
    deliveryTotalFeeSnapshot: 200_000,
    items: [
      {
        productNameSnapshot: "Chocolate Cake",
        variantNameSnapshot: "Slice",
        quantity: 2,
        lineTotal: 500_000,
      },
    ],
    status: OrderStatus.PENDING_PAYMENT,
    deliveredAt: null,
    paymentInstructionSnapshot: "Transfer to Sunflour Bakery.",
    proofWhatsappNumberSnapshot: "+2348000000000",
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
    mocks.adminOrderAlertEmails = "";
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
    mocks.emailOutboxUpdateMany.mockResolvedValue({ count: 1 });
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
          payloadJson: expect.objectContaining({
            whatsAppProofUrl: expect.stringContaining("https://wa.me/"),
          }),
        }),
      }),
    );
  });

  it("queues multiple admin alert recipients for one order", async () => {
    mocks.adminOrderAlertEmails = "owner@example.com,manager@example.com";

    const alerts = await queueAdminNewOrderAlertEmailsForOrder(order());

    expect(alerts).toHaveLength(2);
    expect(mocks.emailOutboxCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientEmail: "owner@example.com",
          templateKey: EmailTemplateKey.ADMIN_NEW_ORDER_ALERT,
        }),
      }),
    );
    expect(mocks.emailOutboxCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientEmail: "manager@example.com",
          templateKey: EmailTemplateKey.ADMIN_NEW_ORDER_ALERT,
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
        amountPaid: 500_000,
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

    expect(mocks.emailOutboxUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "email_1",
          status: EmailOutboxStatus.QUEUED,
        }),
        data: expect.objectContaining({
          status: EmailOutboxStatus.PROCESSING,
        }),
      }),
    );
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

  it("does not send when another processor already claimed the row", async () => {
    mocks.emailOutboxFindUnique
      .mockResolvedValueOnce(outbox())
      .mockResolvedValueOnce(
        outbox({
          status: EmailOutboxStatus.PROCESSING,
        }),
      );
    mocks.emailOutboxUpdateMany.mockResolvedValueOnce({ count: 0 });

    const result = await sendQueuedEmail("email_1");

    expect(result.ok).toBe(false);
    expect(result.outbox.status).toBe(EmailOutboxStatus.PROCESSING);
    expect(mockedSendEmailWithResend).not.toHaveBeenCalled();
  });

  it("processes only claimable queued email rows", async () => {
    mocks.emailOutboxFindMany.mockResolvedValueOnce([{ id: "email_1" }]);
    mocks.emailOutboxFindUnique.mockResolvedValueOnce(outbox());
    mockedSendEmailWithResend.mockResolvedValueOnce({ id: "resend_1" });
    mocks.emailOutboxUpdate.mockImplementationOnce(
      async (args: { data: Record<string, unknown> }) =>
        outbox({
          status: args.data.status,
          resendEmailId: args.data.resendEmailId,
          sentAt: args.data.sentAt,
        }),
    );

    const result = await processEmailOutbox();

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);
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
