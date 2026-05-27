import { z } from "zod";
import { DeliveryMethod } from "@/generated/prisma/enums";

const nameSchema = z.string().trim().min(2).max(120);
const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .regex(/^\+?[0-9][0-9\s().-]{6,29}$/, {
    message: "Enter a valid phone number.",
  })
  .transform((phone) => {
    const hasInternationalPrefix = phone.startsWith("+");
    const digits = phone.replace(/\D/g, "");

    return hasInternationalPrefix ? `+${digits}` : digits;
  });

const optionalEmailSchema = z
  .string()
  .trim()
  .email()
  .optional()
  .or(z.literal("").transform(() => undefined));

const deliveryMethodSchema = z.enum([
  DeliveryMethod.DELIVERY,
  DeliveryMethod.PICKUP,
]);

const checkoutItemSchema = z
  .object({
    productId: z.string().min(1),
    variantId: z.string().min(1).optional(),
    quantity: z.number().int().min(1).max(99),
  })
  .strict();

export const checkoutCreateSchema = z
  .object({
    customer: z
      .object({
        fullName: nameSchema,
        phone: phoneSchema,
        email: optionalEmailSchema,
      })
      .strict(),
    delivery: z
      .object({
        method: deliveryMethodSchema,
        zoneId: z.string().min(1).optional(),
        address: z.string().trim().min(5).max(240).optional(),
      })
      .strict(),
    items: z.array(checkoutItemSchema).min(1).max(50),
    customerNote: z.string().trim().max(500).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.delivery.method === DeliveryMethod.DELIVERY) {
      if (!input.delivery.zoneId) {
        context.addIssue({
          code: "custom",
          path: ["delivery", "zoneId"],
          message: "Choose a delivery zone.",
        });
      }

      if (!input.delivery.address) {
        context.addIssue({
          code: "custom",
          path: ["delivery", "address"],
          message: "Enter the delivery address.",
        });
      }
    }

    const seenItems = new Set<string>();

    input.items.forEach((item, index) => {
      const key = `${item.productId}:${item.variantId ?? ""}`;

      if (seenItems.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["items", index],
          message: "Combine duplicate items into one quantity.",
        });
      }

      seenItems.add(key);
    });
  });

export const checkoutHeadersSchema = z
  .object({
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/, {
        message: "Use letters, numbers, dots, underscores, colons, or hyphens.",
      }),
  })
  .strict();

export type CheckoutCreateInput = z.infer<typeof checkoutCreateSchema>;
export type CheckoutItemInput = CheckoutCreateInput["items"][number];
export type CheckoutHeadersInput = z.infer<typeof checkoutHeadersSchema>;
