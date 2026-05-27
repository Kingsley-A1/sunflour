import { z } from "zod";
import { EmailTemplateKey } from "@/generated/prisma/enums";

export const emailTemplateKeys = [
  EmailTemplateKey.ORDER_CONFIRMATION,
  EmailTemplateKey.PURCHASE_INVOICE,
  EmailTemplateKey.AUTH_PASSWORD_RESET,
  EmailTemplateKey.ADMIN_NEW_ORDER_ALERT,
  EmailTemplateKey.ORDER_STATUS_UPDATE,
  EmailTemplateKey.APPRECIATION_AFTER_DELIVERY,
] as const;

export const emailTemplateKeySchema = z.enum(emailTemplateKeys);

export const emailOutboxIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export const emailTemplateParamSchema = z.object({
  key: emailTemplateKeySchema,
});

export const emailOutboxListQuerySchema = z.object({
  status: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const emailOutboxProcessSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const emailTemplateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  subject: z.string().trim().min(1).max(180).optional(),
  bodySchemaOrComponentKey: z.string().trim().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

export const manualEmailQueueSchema = z.object({
  templateKey: emailTemplateKeySchema,
  recipientEmail: z.string().trim().email().max(254),
  recipientName: z.string().trim().min(1).max(120).optional(),
  orderId: z.string().trim().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type EmailTemplateUpdateInput = z.infer<
  typeof emailTemplateUpdateSchema
>;

export type ManualEmailQueueInput = z.infer<typeof manualEmailQueueSchema>;
