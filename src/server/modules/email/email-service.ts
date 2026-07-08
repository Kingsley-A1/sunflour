import type { Prisma } from "@/generated/prisma/client";
import {
  EmailEventType,
  EmailOutboxStatus,
  EmailTemplateKey,
  OrderStatus,
} from "@/generated/prisma/enums";
import type {
  EmailOutboxStatus as EmailOutboxStatusValue,
  EmailTemplateKey as EmailTemplateKeyValue,
  OrderStatus as OrderStatusValue,
} from "@/generated/prisma/enums";
import type { AuthenticatedUser } from "@/server/auth/rbac";
import { getServerEnv } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { writeAuditLog } from "@/server/modules/audit/audit-service";
import { buildInvoicePublicUrl } from "@/server/modules/invoices";
import {
  buildWhatsAppProofMessage,
  buildWhatsAppProofUrl,
} from "@/server/modules/payments/payment-instructions";
import type {
  EmailTemplateUpdateInput,
  ManualEmailQueueInput,
} from "./email-schemas";
import { canSend } from "./email-policy-service";
import {
  getRegisteredEmailTemplate,
  renderEmailTemplate,
} from "./email-template-service";
import { sendEmailWithResend } from "./resend-client";

const emailOutboxSelect = {
  id: true,
  orderId: true,
  recipientEmail: true,
  recipientName: true,
  templateKey: true,
  subjectSnapshot: true,
  htmlSnapshot: true,
  payloadJson: true,
  status: true,
  resendEmailId: true,
  errorMessage: true,
  attemptCount: true,
  nextAttemptAt: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmailOutboxSelect;

export type EmailOutboxRecord = Prisma.EmailOutboxGetPayload<{
  select: typeof emailOutboxSelect;
}>;

export interface QueueEmailInput {
  templateKey: EmailTemplateKeyValue;
  recipientEmail: string;
  recipientName?: string | null;
  orderId?: string | null;
  payload: Record<string, unknown>;
}

export interface EmailSendResult {
  ok: boolean;
  outbox: EmailOutboxRecord;
  errorMessage?: string;
}

export interface EmailOrderForQueue {
  id: string;
  orderNumber: string;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  customerEmailSnapshot: string | null;
  subtotal: number;
  total: number;
  deliveryTotalFeeSnapshot: number;
  status: OrderStatusValue;
  deliveredAt?: Date | null;
  paymentInstructionSnapshot?: string | null;
  proofWhatsappNumberSnapshot?: string | null;
  invoice?: {
    invoiceNumber: string;
    publicAccessToken: string;
  } | null;
}

export interface OrderStatusEmailInput {
  orderNumber: string;
  customerNameSnapshot: string;
  customerEmailSnapshot: string | null;
}

// Statuses worth emailing the customer about. Internal/intermediate states
// (PENDING_PAYMENT, PAYMENT_UNDER_REVIEW) are intentionally excluded.
const customerNotifiableOrderStatuses = new Set<OrderStatusValue>([
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
]);

const orderStatusEmailLabels: Record<OrderStatusValue, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAYMENT_UNDER_REVIEW: "Payment under review",
  PAYMENT_CONFIRMED: "Payment confirmed",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

function notFound(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.NOT_FOUND,
    publicMessage: message,
    status: 404,
  });
}

function invalidEmailState(message: string): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage: message,
    status: 400,
  });
}

function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Email send failed.";
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function buildAbsoluteInvoiceUrl(order: EmailOrderForQueue): string | undefined {
  if (!order.invoice?.publicAccessToken) {
    return undefined;
  }

  const path = buildInvoicePublicUrl(
    order.orderNumber,
    order.invoice.publicAccessToken,
  );
  const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return path;
  }

  return `${appUrl.replace(/\/$/, "")}${path}`;
}

function orderEmailPayload(order: EmailOrderForQueue): Record<string, unknown> {
  const whatsAppProofMessage = buildWhatsAppProofMessage({
    orderNumber: order.orderNumber,
    customerName: order.customerNameSnapshot,
    amountPaid: order.subtotal,
  });

  return {
    orderNumber: order.orderNumber,
    customerName: order.customerNameSnapshot,
    customerPhone: order.customerPhoneSnapshot,
    amountPaid: order.subtotal,
    deliveryFeeDueOnDelivery: order.deliveryTotalFeeSnapshot,
    total: order.total,
    invoiceNumber: order.invoice?.invoiceNumber,
    invoiceUrl: buildAbsoluteInvoiceUrl(order),
    paymentInstruction: order.paymentInstructionSnapshot ?? undefined,
    whatsAppProofUrl: buildWhatsAppProofUrl(
      whatsAppProofMessage,
      order.proofWhatsappNumberSnapshot,
    ),
  };
}

function nextAttemptAt(attemptCount: number, now: Date): Date {
  const delayMinutes = Math.min(60, Math.max(5, attemptCount * 5));

  return new Date(now.getTime() + delayMinutes * 60_000);
}

function emailEventForStatus(status: EmailOutboxStatusValue): EmailEventType {
  return status === EmailOutboxStatus.SKIPPED
    ? EmailEventType.SKIPPED
    : EmailEventType.QUEUED;
}

export async function queueEmail(
  input: QueueEmailInput,
): Promise<EmailOutboxRecord> {
  let rendered = renderEmailTemplate({
    key: input.templateKey,
    payload: input.payload,
  });
  const policy = await canSend({
    templateKey: input.templateKey,
  });

  if (policy.subjectOverride) {
    rendered = renderEmailTemplate({
      key: input.templateKey,
      payload: input.payload,
      subjectOverride: policy.subjectOverride,
    });
  }

  const status = policy.canSend
    ? EmailOutboxStatus.QUEUED
    : EmailOutboxStatus.SKIPPED;

  try {
    return await prisma.emailOutbox.create({
      data: {
        orderId: input.orderId ?? null,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName ?? null,
        templateKey: input.templateKey,
        subjectSnapshot: rendered.subject,
        htmlSnapshot: rendered.html,
        payloadJson: input.payload as Prisma.InputJsonObject,
        status,
        errorMessage: policy.reason,
        events: {
          create: {
            eventType: emailEventForStatus(status),
            message: policy.reason ?? "Email queued.",
          },
        },
      },
      select: emailOutboxSelect,
    });
  } catch (error) {
    if (!input.orderId || !hasPrismaCode(error, "P2002")) {
      throw error;
    }

    const existing = await prisma.emailOutbox.findFirst({
      where: {
        orderId: input.orderId,
        templateKey: input.templateKey,
        recipientEmail: input.recipientEmail,
      },
      select: emailOutboxSelect,
    });

    if (!existing) {
      throw error;
    }

    return existing;
  }
}

export async function queueManualEmail(input: ManualEmailQueueInput) {
  return queueEmail({
    templateKey: input.templateKey,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    orderId: input.orderId,
    payload: input.payload,
  });
}

export async function queueOrderConfirmationEmailForOrder(
  order: EmailOrderForQueue,
): Promise<EmailOutboxRecord | null> {
  if (!order.customerEmailSnapshot) {
    return null;
  }

  return queueEmail({
    templateKey: EmailTemplateKey.ORDER_CONFIRMATION,
    recipientEmail: order.customerEmailSnapshot,
    recipientName: order.customerNameSnapshot,
    orderId: order.id,
    payload: orderEmailPayload(order),
  });
}

export async function queuePurchaseInvoiceEmailForOrder(
  order: EmailOrderForQueue,
): Promise<EmailOutboxRecord | null> {
  if (!order.customerEmailSnapshot) {
    return null;
  }

  return queueEmail({
    templateKey: EmailTemplateKey.PURCHASE_INVOICE,
    recipientEmail: order.customerEmailSnapshot,
    recipientName: order.customerNameSnapshot,
    orderId: order.id,
    payload: orderEmailPayload(order),
  });
}

export async function queueAdminNewOrderAlertEmailsForOrder(
  order: EmailOrderForQueue,
): Promise<EmailOutboxRecord[]> {
  const recipients = getServerEnv()
    .ADMIN_ORDER_ALERT_EMAILS.split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return [];
  }

  return Promise.all(
    recipients.map((recipientEmail) =>
      queueEmail({
        templateKey: EmailTemplateKey.ADMIN_NEW_ORDER_ALERT,
        recipientEmail,
        orderId: order.id,
        payload: orderEmailPayload(order),
      }),
    ),
  );
}

export async function queueOrderStatusUpdateEmailForOrder(
  order: OrderStatusEmailInput,
  status: OrderStatusValue,
): Promise<EmailOutboxRecord | null> {
  if (
    !order.customerEmailSnapshot ||
    !customerNotifiableOrderStatuses.has(status)
  ) {
    return null;
  }

  // Status updates are intentionally queued without orderId: the outbox unique
  // constraint [orderId, templateKey, recipientEmail] would otherwise collapse
  // every transition into a single email per order. The order is still
  // traceable through the orderNumber in the subject and payload.
  return queueEmail({
    templateKey: EmailTemplateKey.ORDER_STATUS_UPDATE,
    recipientEmail: order.customerEmailSnapshot,
    recipientName: order.customerNameSnapshot,
    payload: {
      orderNumber: order.orderNumber,
      customerName: order.customerNameSnapshot,
      status: orderStatusEmailLabels[status],
    },
  });
}

export async function queueAppreciationAfterDeliveryEmail(
  order: EmailOrderForQueue,
): Promise<EmailOutboxRecord | null> {
  if (
    order.status !== OrderStatus.DELIVERED ||
    !order.deliveredAt ||
    !order.customerEmailSnapshot
  ) {
    return null;
  }

  const existing = await prisma.emailOutbox.findFirst({
    where: {
      orderId: order.id,
      templateKey: EmailTemplateKey.APPRECIATION_AFTER_DELIVERY,
    },
    select: emailOutboxSelect,
  });

  if (existing) {
    return existing;
  }

  return queueEmail({
    templateKey: EmailTemplateKey.APPRECIATION_AFTER_DELIVERY,
    recipientEmail: order.customerEmailSnapshot,
    recipientName: order.customerNameSnapshot,
    orderId: order.id,
    payload: {
      orderNumber: order.orderNumber,
      customerName: order.customerNameSnapshot,
    },
  });
}

export type AccountStatusAction = "SUSPENDED" | "REACTIVATED" | "REMOVED";

export interface AccountStatusNoticeInput {
  recipientEmail: string | null;
  recipientName?: string | null;
  action: AccountStatusAction;
  businessName: string;
  reason?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}

export async function queueAccountStatusNoticeEmail(
  input: AccountStatusNoticeInput,
): Promise<EmailOutboxRecord | null> {
  if (!input.recipientEmail) {
    return null;
  }

  // No orderId: account notices are not order-scoped, and a null orderId keeps
  // the outbox unique constraint from collapsing repeated notices to one row.
  return queueEmail({
    templateKey: EmailTemplateKey.ACCOUNT_STATUS_NOTICE,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName ?? undefined,
    payload: {
      action: input.action,
      recipientName: input.recipientName ?? undefined,
      businessName: input.businessName,
      reason: input.reason ?? undefined,
      supportEmail: input.supportEmail ?? undefined,
      supportPhone: input.supportPhone ?? undefined,
    },
  });
}

export async function sendQueuedEmail(id: string): Promise<EmailSendResult> {
  const now = new Date();
  const outbox = await prisma.emailOutbox.findUnique({
    where: {
      id,
    },
    select: emailOutboxSelect,
  });

  if (!outbox) {
    throw notFound("Email outbox record not found.");
  }

  if (outbox.status !== EmailOutboxStatus.QUEUED) {
    return {
      ok: false,
      outbox,
      errorMessage: `Email is ${outbox.status}.`,
    };
  }

  if (outbox.nextAttemptAt && outbox.nextAttemptAt > now) {
    return {
      ok: false,
      outbox,
      errorMessage: "Email is waiting for its next retry window.",
    };
  }

  const claim = await prisma.emailOutbox.updateMany({
    where: {
      id,
      status: EmailOutboxStatus.QUEUED,
      OR: [
        {
          nextAttemptAt: null,
        },
        {
          nextAttemptAt: {
            lte: now,
          },
        },
      ],
    },
    data: {
      status: EmailOutboxStatus.PROCESSING,
      errorMessage: null,
    },
  });

  if (claim.count !== 1) {
    const latest = await prisma.emailOutbox.findUnique({
      where: { id },
      select: emailOutboxSelect,
    });

    if (!latest) {
      throw notFound("Email outbox record not found.");
    }

    return {
      ok: false,
      outbox: latest,
      errorMessage: `Email is ${latest.status}.`,
    };
  }

  try {
    const result = await sendEmailWithResend({
      to: outbox.recipientEmail,
      subject: outbox.subjectSnapshot,
      html: outbox.htmlSnapshot,
    });
    const sent = await prisma.emailOutbox.update({
      where: {
        id,
      },
      data: {
        status: EmailOutboxStatus.SENT,
        resendEmailId: result.id,
        errorMessage: null,
        attemptCount: {
          increment: 1,
        },
        nextAttemptAt: null,
        sentAt: new Date(),
        events: {
          create: {
            eventType: EmailEventType.SENT,
            resendEmailId: result.id,
            message: "Email sent through Resend.",
          },
        },
      },
      select: emailOutboxSelect,
    });

    return {
      ok: true,
      outbox: sent,
    };
  } catch (error) {
    const message = errorMessageFromUnknown(error);
    const failed = await prisma.emailOutbox.update({
      where: {
        id,
      },
      data: {
        status: EmailOutboxStatus.FAILED,
        errorMessage: message,
        attemptCount: {
          increment: 1,
        },
        nextAttemptAt: nextAttemptAt(outbox.attemptCount + 1, new Date()),
        events: {
          create: {
            eventType: EmailEventType.FAILED,
            errorMessage: message,
            message: "Email send failed.",
          },
        },
      },
      select: emailOutboxSelect,
    });

    return {
      ok: false,
      outbox: failed,
      errorMessage: message,
    };
  }
}

export async function retryFailedEmail(id: string): Promise<EmailOutboxRecord> {
  const outbox = await prisma.emailOutbox.findUnique({
    where: {
      id,
    },
    select: emailOutboxSelect,
  });

  if (!outbox) {
    throw notFound("Email outbox record not found.");
  }

  if (outbox.status !== EmailOutboxStatus.FAILED) {
    throw invalidEmailState("Only failed emails can be retried.");
  }

  return prisma.emailOutbox.update({
    where: {
      id,
    },
    data: {
      status: EmailOutboxStatus.QUEUED,
      errorMessage: null,
      nextAttemptAt: null,
      events: {
        create: {
          eventType: EmailEventType.RETRIED,
          message: "Email retry queued by admin.",
        },
      },
    },
    select: emailOutboxSelect,
  });
}

export async function processEmailOutbox(input: { limit?: number } = {}) {
  const now = new Date();
  const limit = input.limit ?? getServerEnv().EMAIL_OUTBOX_BATCH_SIZE;
  const queued = await prisma.emailOutbox.findMany({
    where: {
      status: EmailOutboxStatus.QUEUED,
      OR: [
        {
          nextAttemptAt: null,
        },
        {
          nextAttemptAt: {
            lte: now,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
    select: {
      id: true,
    },
  });
  const results: EmailSendResult[] = [];

  for (const email of queued) {
    results.push(await sendQueuedEmail(email.id));
  }

  return {
    processed: results.length,
    sent: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results: results.map((result) => ({
      id: result.outbox.id,
      status: result.outbox.status,
      errorMessage: result.errorMessage ?? null,
    })),
  };
}

export async function listEmailOutboxForAdmin(input: {
  status?: string;
  limit: number;
}) {
  const status = Object.values(EmailOutboxStatus).includes(
    input.status as EmailOutboxStatusValue,
  )
    ? (input.status as EmailOutboxStatusValue)
    : undefined;

  return prisma.emailOutbox.findMany({
    where: status
      ? {
          status,
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit,
    select: {
      ...emailOutboxSelect,
      events: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          eventType: true,
          message: true,
          errorMessage: true,
          resendEmailId: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function upsertEmailTemplateForAdmin(
  key: EmailTemplateKeyValue,
  input: EmailTemplateUpdateInput,
  actor: AuthenticatedUser,
) {
  const registered = getRegisteredEmailTemplate(key);
  const existing = await prisma.emailTemplate.findUnique({
    where: {
      key,
    },
    select: {
      id: true,
      name: true,
      subject: true,
      bodySchemaOrComponentKey: true,
      isActive: true,
    },
  });
  const defaultRendered = registered.render(defaultPayloadForTemplate(key));

  return prisma.$transaction(async (transaction) => {
    const template = await transaction.emailTemplate.upsert({
      where: {
        key,
      },
      create: {
        key,
        name: input.name ?? registered.name,
        subject: input.subject ?? defaultRendered.subject,
        bodySchemaOrComponentKey:
          input.bodySchemaOrComponentKey ?? registered.bodySchemaOrComponentKey,
        isActive: input.isActive ?? true,
        updatedByUserId: actor.id,
      },
      update: {
        name: input.name,
        subject: input.subject,
        bodySchemaOrComponentKey: input.bodySchemaOrComponentKey,
        isActive: input.isActive,
        updatedByUserId: actor.id,
      },
      select: {
        id: true,
        key: true,
        name: true,
        subject: true,
        bodySchemaOrComponentKey: true,
        isActive: true,
        updatedByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "EMAIL_TEMPLATE_UPDATE",
        targetType: "email_template",
        targetId: template.id,
        metadata: {
          key,
          before: existing,
          after: template,
        },
      },
      transaction,
    );

    return template;
  });
}

function defaultPayloadForTemplate(
  key: EmailTemplateKeyValue,
): Record<string, unknown> {
  if (key === EmailTemplateKey.AUTH_PASSWORD_RESET) {
    return {
      resetUrl: "https://sunflour.example/reset",
      customerName: "Customer",
    };
  }

  if (key === EmailTemplateKey.ADMIN_NEW_ORDER_ALERT) {
    return {
      orderNumber: "SFB-20260101-ABC123",
      customerName: "Customer",
      customerPhone: "+2348000000000",
      total: 0,
    };
  }

  if (key === EmailTemplateKey.ORDER_STATUS_UPDATE) {
    return {
      orderNumber: "SFB-20260101-ABC123",
      customerName: "Customer",
      status: "PREPARING",
    };
  }

  if (key === EmailTemplateKey.APPRECIATION_AFTER_DELIVERY) {
    return {
      orderNumber: "SFB-20260101-ABC123",
      customerName: "Customer",
    };
  }

  return {
    orderNumber: "SFB-20260101-ABC123",
    customerName: "Customer",
    customerPhone: "+2348000000000",
    total: 0,
    invoiceNumber: "INV-SFB-20260101-ABC123",
    invoiceUrl:
      "https://sunflour.example/api/v1/public/invoices/SFB-20260101-ABC123?token=example",
  };
}
