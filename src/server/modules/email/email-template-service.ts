import { z } from "zod";
import { EmailTemplateKey } from "@/generated/prisma/enums";
import type { EmailTemplateKey as EmailTemplateKeyValue } from "@/generated/prisma/enums";
import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { formatNairaFromKobo } from "@/server/lib/money/money";
import { formatZodFieldErrors } from "@/server/lib/validation/zod";

export interface RenderedEmailTemplate {
  subject: string;
  html: string;
}

export interface RegisteredEmailTemplate {
  key: EmailTemplateKeyValue;
  name: string;
  bodySchemaOrComponentKey: string;
  render: (payload: Record<string, unknown>) => RenderedEmailTemplate;
}

function templateValidationError(error: z.ZodError): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage: "Email template payload is invalid.",
    status: 400,
    fieldErrors: formatZodFieldErrors(error),
  });
}

function invalidTemplateKey(key: string): AppError {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    publicMessage: `Unsupported transactional email template: ${key}.`,
    status: 400,
    fieldErrors: {
      templateKey: ["Choose a supported transactional email template."],
    },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLayout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#fff8ec;color:#24150d;font-family:Inter,Arial,sans-serif;">
  <main style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <section style="background:#ffffff;border:1px solid #e9dcc8;border-radius:8px;padding:24px;">
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px;color:#b22416;">${escapeHtml(title)}</h1>
      ${body}
    </section>
    <p style="margin:16px 0 0;color:#6f4b33;font-size:13px;line-height:1.5;">
      Sunflour Bakery sends only transactional order emails.
    </p>
  </main>
</body>
</html>`;
}

function paragraph(value: string): string {
  return `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">${value}</p>`;
}

function actionLink(label: string, href: string | undefined): string {
  if (!href) {
    return "";
  }

  return `<p style="margin:20px 0 14px;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#b22416;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 16px;font-weight:700;">${escapeHtml(label)}</a></p>`;
}

function totalLine(label: string, amount: number): string {
  return `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(formatNairaFromKobo(amount))}</p>`;
}

const orderEmailPayloadSchema = z.object({
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
  total: z.number().int().nonnegative(),
  invoiceNumber: z.string().min(1).optional(),
  invoiceUrl: z.string().min(1).optional(),
  paymentInstruction: z.string().min(1).optional(),
  whatsAppProofUrl: z.string().min(1).optional(),
});

const adminOrderPayloadSchema = orderEmailPayloadSchema.extend({
  customerPhone: z.string().min(1),
});

const statusUpdatePayloadSchema = z.object({
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
  status: z.string().min(1),
});

const appreciationPayloadSchema = z.object({
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
});

const passwordResetPayloadSchema = z.object({
  resetUrl: z.string().url(),
  customerName: z.string().min(1).optional(),
});

const accountStatusNoticePayloadSchema = z.object({
  action: z.enum(["SUSPENDED", "REACTIVATED", "REMOVED"]),
  recipientName: z.string().min(1).optional(),
  businessName: z.string().min(1),
  reason: z.string().min(1).optional(),
  supportEmail: z.string().min(1).optional(),
  supportPhone: z.string().min(1).optional(),
});

function parsePayload<T extends z.ZodType>(
  schema: T,
  payload: Record<string, unknown>,
): z.infer<T> {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw templateValidationError(result.error);
  }

  return result.data;
}

const registry = {
  [EmailTemplateKey.ORDER_CONFIRMATION]: {
    key: EmailTemplateKey.ORDER_CONFIRMATION,
    name: "Order confirmation",
    bodySchemaOrComponentKey: "order-confirmation-v1",
    render(payload) {
      const data = parsePayload(orderEmailPayloadSchema, payload);
      const title = `Order ${data.orderNumber} received`;

      return {
        subject: `Order ${data.orderNumber} received - Sunflour Bakery`,
        html: renderLayout(
          title,
          [
            paragraph(`Hello ${escapeHtml(data.customerName)}, your order has been received and is waiting for manual payment confirmation.`),
            totalLine("Order total", data.total),
            data.invoiceNumber
              ? paragraph(`<strong>Invoice:</strong> ${escapeHtml(data.invoiceNumber)}`)
              : "",
            data.paymentInstruction
              ? paragraph(`<strong>Payment instruction:</strong><br />${escapeHtml(data.paymentInstruction).replaceAll("\n", "<br />")}`)
              : "",
            actionLink("View invoice", data.invoiceUrl),
            actionLink("Send payment proof on WhatsApp", data.whatsAppProofUrl),
          ].join(""),
        ),
      };
    },
  },
  [EmailTemplateKey.PURCHASE_INVOICE]: {
    key: EmailTemplateKey.PURCHASE_INVOICE,
    name: "Purchase invoice",
    bodySchemaOrComponentKey: "purchase-invoice-v1",
    render(payload) {
      const data = parsePayload(orderEmailPayloadSchema, payload);
      const invoiceNumber = data.invoiceNumber ?? `Invoice for ${data.orderNumber}`;
      const title = `Invoice ${invoiceNumber}`;

      return {
        subject: `Invoice ${invoiceNumber} - Sunflour Bakery`,
        html: renderLayout(
          title,
          [
            paragraph(`Hello ${escapeHtml(data.customerName)}, here is the invoice for order ${escapeHtml(data.orderNumber)}.`),
            totalLine("Invoice total", data.total),
            actionLink("View invoice", data.invoiceUrl),
          ].join(""),
        ),
      };
    },
  },
  [EmailTemplateKey.AUTH_PASSWORD_RESET]: {
    key: EmailTemplateKey.AUTH_PASSWORD_RESET,
    name: "Password reset",
    bodySchemaOrComponentKey: "auth-password-reset-v1",
    render(payload) {
      const data = parsePayload(passwordResetPayloadSchema, payload);
      const title = "Reset your Sunflour password";

      return {
        subject: "Reset your Sunflour Bakery password",
        html: renderLayout(
          title,
          [
            paragraph(`Hello ${escapeHtml(data.customerName ?? "there")}, use the secure link below to reset your password.`),
            actionLink("Reset password", data.resetUrl),
          ].join(""),
        ),
      };
    },
  },
  [EmailTemplateKey.ADMIN_NEW_ORDER_ALERT]: {
    key: EmailTemplateKey.ADMIN_NEW_ORDER_ALERT,
    name: "Admin new order alert",
    bodySchemaOrComponentKey: "admin-new-order-alert-v1",
    render(payload) {
      const data = parsePayload(adminOrderPayloadSchema, payload);
      const title = `New order ${data.orderNumber}`;

      return {
        subject: `New Sunflour order ${data.orderNumber}`,
        html: renderLayout(
          title,
          [
            paragraph(`<strong>Customer:</strong> ${escapeHtml(data.customerName)}`),
            paragraph(`<strong>Phone:</strong> ${escapeHtml(data.customerPhone)}`),
            totalLine("Order total", data.total),
            actionLink("View invoice", data.invoiceUrl),
          ].join(""),
        ),
      };
    },
  },
  [EmailTemplateKey.ORDER_STATUS_UPDATE]: {
    key: EmailTemplateKey.ORDER_STATUS_UPDATE,
    name: "Order status update",
    bodySchemaOrComponentKey: "order-status-update-v1",
    render(payload) {
      const data = parsePayload(statusUpdatePayloadSchema, payload);
      const title = `Order ${data.orderNumber} update`;

      return {
        subject: `Order ${data.orderNumber} update: ${data.status}`,
        html: renderLayout(
          title,
          paragraph(`Hello ${escapeHtml(data.customerName)}, your order status is now ${escapeHtml(data.status)}.`),
        ),
      };
    },
  },
  [EmailTemplateKey.APPRECIATION_AFTER_DELIVERY]: {
    key: EmailTemplateKey.APPRECIATION_AFTER_DELIVERY,
    name: "Appreciation after delivery",
    bodySchemaOrComponentKey: "appreciation-after-delivery-v1",
    render(payload) {
      const data = parsePayload(appreciationPayloadSchema, payload);
      const title = "Thank you for ordering from Sunflour";

      return {
        subject: "Thank you for ordering from Sunflour Bakery",
        html: renderLayout(
          title,
          paragraph(`Hello ${escapeHtml(data.customerName)}, thank you for choosing Sunflour Bakery. We appreciate your order ${escapeHtml(data.orderNumber)}.`),
        ),
      };
    },
  },
  [EmailTemplateKey.ACCOUNT_STATUS_NOTICE]: {
    key: EmailTemplateKey.ACCOUNT_STATUS_NOTICE,
    name: "Account status notice",
    bodySchemaOrComponentKey: "account-status-notice-v1",
    render(payload) {
      const data = parsePayload(accountStatusNoticePayloadSchema, payload);
      const name = escapeHtml(data.recipientName ?? "there");
      const business = escapeHtml(data.businessName);
      const copy: Record<
        typeof data.action,
        { title: string; subject: string; lead: string }
      > = {
        SUSPENDED: {
          title: "Your account has been suspended",
          subject: `Your ${data.businessName} account has been suspended`,
          lead: "your account has been <strong>suspended</strong> and you can no longer sign in.",
        },
        REACTIVATED: {
          title: "Your account has been reactivated",
          subject: `Your ${data.businessName} account has been reactivated`,
          lead: "your account has been <strong>reactivated</strong>. You can sign in again.",
        },
        REMOVED: {
          title: "Your account has been removed",
          subject: `Your ${data.businessName} account has been removed`,
          lead: `your account has been <strong>removed</strong> from ${business}.`,
        },
      };
      const current = copy[data.action];
      const contactBits: string[] = [];

      if (data.supportEmail) {
        contactBits.push(
          `email <a href="mailto:${escapeHtml(data.supportEmail)}">${escapeHtml(data.supportEmail)}</a>`,
        );
      }
      if (data.supportPhone) {
        contactBits.push(
          `call <a href="tel:${escapeHtml(data.supportPhone)}">${escapeHtml(data.supportPhone)}</a>`,
        );
      }

      const recovery =
        contactBits.length > 0
          ? paragraph(
              `If you believe this was a mistake or want to recover your account, please ${contactBits.join(" or ")}.`,
            )
          : paragraph(
              `If you believe this was a mistake, please contact ${business} to recover your account.`,
            );

      return {
        subject: current.subject,
        html: renderLayout(
          current.title,
          [
            paragraph(`Hello ${name}, ${current.lead}`),
            data.reason
              ? paragraph(`<strong>Reason:</strong> ${escapeHtml(data.reason)}`)
              : "",
            recovery,
          ].join(""),
        ),
      };
    },
  },
} satisfies Record<EmailTemplateKeyValue, RegisteredEmailTemplate>;

export function getRegisteredEmailTemplates(): RegisteredEmailTemplate[] {
  return Object.values(registry);
}

export function getRegisteredEmailTemplate(
  key: EmailTemplateKeyValue,
): RegisteredEmailTemplate {
  const template = registry[key];

  if (!template) {
    throw invalidTemplateKey(key);
  }

  return template;
}

export function renderEmailTemplate(input: {
  key: EmailTemplateKeyValue;
  payload: Record<string, unknown>;
  subjectOverride?: string | null;
}): RenderedEmailTemplate {
  const rendered = getRegisteredEmailTemplate(input.key).render(input.payload);

  if (!input.subjectOverride) {
    return rendered;
  }

  return {
    ...rendered,
    subject: applySubjectTemplate(input.subjectOverride, input.payload),
  };
}

export function applySubjectTemplate(
  subject: string,
  payload: Record<string, unknown>,
): string {
  return subject.replaceAll(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) =>
    escapeHtml(payload[key]),
  );
}
