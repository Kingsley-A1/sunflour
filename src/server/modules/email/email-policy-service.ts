import { EmailTemplateKey } from "@/generated/prisma/enums";
import type { EmailTemplateKey as EmailTemplateKeyValue } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";
import { getRegisteredEmailTemplates } from "./email-template-service";

export interface EmailPolicyDecision {
  canSend: boolean;
  reason: string | null;
  subjectOverride: string | null;
}

export async function canSend(input: {
  templateKey: EmailTemplateKeyValue;
}): Promise<EmailPolicyDecision> {
  const template = await prisma.emailTemplate.findUnique({
    where: {
      key: input.templateKey,
    },
    select: {
      subject: true,
      isActive: true,
    },
  });

  if (template && !template.isActive) {
    return {
      canSend: false,
      reason: "Email template is disabled.",
      subjectOverride: template.subject,
    };
  }

  return {
    canSend: true,
    reason: null,
    subjectOverride: template?.subject ?? null,
  };
}

export async function getEmailTemplatesForAdmin() {
  const records = await prisma.emailTemplate.findMany({
    orderBy: {
      key: "asc",
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
  const byKey = new Map(records.map((record) => [record.key, record]));

  return getRegisteredEmailTemplates().map((template) => {
    const record = byKey.get(template.key);

    return {
      id: record?.id ?? null,
      key: template.key,
      name: record?.name ?? template.name,
      subject: record?.subject ?? template.render(defaultPayload(template.key)).subject,
      bodySchemaOrComponentKey:
        record?.bodySchemaOrComponentKey ?? template.bodySchemaOrComponentKey,
      isActive: record?.isActive ?? true,
      updatedByUserId: record?.updatedByUserId ?? null,
      createdAt: record?.createdAt ?? null,
      updatedAt: record?.updatedAt ?? null,
    };
  });
}

function defaultPayload(templateKey: EmailTemplateKeyValue): Record<string, unknown> {
  if (templateKey === EmailTemplateKey.AUTH_PASSWORD_RESET) {
    return {
      resetUrl: "https://sunflour.example/reset",
      customerName: "Customer",
    };
  }

  if (templateKey === EmailTemplateKey.ADMIN_NEW_ORDER_ALERT) {
    return {
      orderNumber: "SFB-20260101-ABC123",
      customerName: "Customer",
      customerPhone: "+2348000000000",
      total: 0,
    };
  }

  if (templateKey === EmailTemplateKey.ORDER_STATUS_UPDATE) {
    return {
      orderNumber: "SFB-20260101-ABC123",
      customerName: "Customer",
      status: "PREPARING",
    };
  }

  if (templateKey === EmailTemplateKey.APPRECIATION_AFTER_DELIVERY) {
    return {
      orderNumber: "SFB-20260101-ABC123",
      customerName: "Customer",
    };
  }

  return {
    orderNumber: "SFB-20260101-ABC123",
    customerName: "Customer",
    total: 0,
    invoiceNumber: "INV-SFB-20260101-ABC123",
    invoiceUrl: "https://sunflour.example/api/v1/public/invoices/SFB-20260101-ABC123?token=example",
  };
}
