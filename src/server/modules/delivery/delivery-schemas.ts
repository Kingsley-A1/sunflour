import { z } from "zod";
import { DeliveryMethod } from "@/generated/prisma/enums";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Use lowercase letters, numbers, and hyphens only.",
  });

const nameSchema = z.string().trim().min(1).max(120);
const moneySchema = z.number().int().min(0).max(5_000_000);
const sortOrderSchema = z.number().int().min(0).max(10_000).optional();
const clockTimeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: "Use HH:mm 24-hour time.",
});

export const deliveryMethodSchema = z.enum([
  DeliveryMethod.DELIVERY,
  DeliveryMethod.PICKUP,
]);

export const deliveryZoneCreateSchema = z
  .object({
    name: nameSchema,
    slug: slugSchema.optional(),
    baseFee: moneySchema,
    isActive: z.boolean().optional(),
    sortOrder: sortOrderSchema,
  })
  .strict();

export const deliveryZoneUpdateSchema =
  deliveryZoneCreateSchema.partial();

export const deliverySurchargeRuleCreateSchema = z
  .object({
    name: nameSchema,
    startsAtTime: clockTimeSchema.default("18:00"),
    endsAtTime: clockTimeSchema.optional().nullable(),
    amount: moneySchema.default(50_000),
    isActive: z.boolean().optional(),
  })
  .strict();

export const deliverySurchargeRuleUpdateSchema =
  deliverySurchargeRuleCreateSchema.partial();

export const deliveryQuoteRequestSchema = z
  .object({
    deliveryMethod: deliveryMethodSchema,
    deliveryZoneId: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (
      input.deliveryMethod === DeliveryMethod.DELIVERY &&
      !input.deliveryZoneId
    ) {
      context.addIssue({
        code: "custom",
        path: ["deliveryZoneId"],
        message: "Choose a delivery zone.",
      });
    }
  });

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export type DeliveryZoneCreateInput = z.infer<
  typeof deliveryZoneCreateSchema
>;
export type DeliveryZoneUpdateInput = z.infer<
  typeof deliveryZoneUpdateSchema
>;
export type DeliverySurchargeRuleCreateInput = z.infer<
  typeof deliverySurchargeRuleCreateSchema
>;
export type DeliverySurchargeRuleUpdateInput = z.infer<
  typeof deliverySurchargeRuleUpdateSchema
>;
export type DeliveryQuoteRequestInput = z.infer<
  typeof deliveryQuoteRequestSchema
>;

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function requireSlug(input: { name: string; slug?: string }): string {
  return slugSchema.parse(input.slug ?? slugify(input.name));
}
