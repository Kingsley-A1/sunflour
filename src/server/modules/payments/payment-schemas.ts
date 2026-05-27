import { z } from "zod";
import { PaymentStatus } from "@/generated/prisma/enums";

const textSchema = z.string().trim().min(1);

const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .regex(/^\+?[0-9][0-9\s().-]{6,29}$/, {
    message: "Enter a valid WhatsApp phone number.",
  })
  .transform((phone) => phone.replace(/\D/g, ""));

export const paymentSettingsUpdateSchema = z
  .object({
    bankName: textSchema.max(120),
    accountName: textSchema.max(160),
    accountNumber: z
      .string()
      .trim()
      .min(5)
      .max(30)
      .regex(/^[0-9]+$/, {
        message: "Use digits only.",
      }),
    paymentInstruction: textSchema.max(1_000),
    proofWhatsappNumber: phoneSchema,
    isActive: z.boolean().optional(),
  })
  .strict();

export const paymentStatusUpdateSchema = z
  .object({
    paymentStatus: z.enum([
      PaymentStatus.UNPAID,
      PaymentStatus.PROOF_SENT_ON_WHATSAPP,
      PaymentStatus.UNDER_REVIEW,
      PaymentStatus.CONFIRMED,
      PaymentStatus.REJECTED,
    ]),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.paymentStatus === PaymentStatus.REJECTED && !input.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Enter the rejection reason.",
      });
    }
  });

export const orderNumberParamSchema = z.object({
  orderNumber: z.string().trim().min(1).max(80),
});

export type PaymentSettingsUpdateInput = z.infer<
  typeof paymentSettingsUpdateSchema
>;
export type PaymentStatusUpdateInput = z.infer<
  typeof paymentStatusUpdateSchema
>;
