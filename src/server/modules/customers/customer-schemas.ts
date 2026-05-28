import { z } from "zod";
import { normalizePhoneForStorage } from "@/server/lib/phone";

const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .regex(/^\+?[0-9][0-9\s().-]{6,29}$/, {
    message: "Enter a valid phone number.",
  })
  .transform(normalizePhoneForStorage);

export const customerProfileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: phoneSchema,
  })
  .strict();

export const customerOrderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const customerOrderNumberParamSchema = z.object({
  orderNumber: z.string().trim().min(1).max(80),
});

export const guestOrderLookupSchema = z
  .object({
    orderNumber: z.string().trim().min(1).max(80),
    phone: phoneSchema,
  })
  .strict();

export type CustomerProfileUpdateInput = z.infer<
  typeof customerProfileUpdateSchema
>;
export type CustomerOrderListQueryInput = z.infer<
  typeof customerOrderListQuerySchema
>;
export type GuestOrderLookupInput = z.infer<typeof guestOrderLookupSchema>;
