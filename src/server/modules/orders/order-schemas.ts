import { z } from "zod";
import {
  CustomerType,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/enums";

const orderStatusSchema = z.enum([
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_UNDER_REVIEW,
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
]);

const paymentStatusSchema = z.enum([
  PaymentStatus.UNPAID,
  PaymentStatus.PROOF_SENT_ON_WHATSAPP,
  PaymentStatus.UNDER_REVIEW,
  PaymentStatus.CONFIRMED,
  PaymentStatus.REJECTED,
]);

const customerTypeSchema = z.enum([
  CustomerType.GUEST,
  CustomerType.AUTHENTICATED,
]);

function blankStringToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim().length === 0
    ? undefined
    : value;
}

const optionalOrderStatusSchema = z.preprocess(
  blankStringToUndefined,
  orderStatusSchema.optional(),
);

const optionalPaymentStatusSchema = z.preprocess(
  blankStringToUndefined,
  paymentStatusSchema.optional(),
);

const optionalCustomerTypeSchema = z.preprocess(
  blankStringToUndefined,
  customerTypeSchema.optional(),
);

const optionalSearchTextSchema = z.preprocess(
  blankStringToUndefined,
  z.string().trim().min(1).max(120).optional(),
);

const optionalDateSchema = z.preprocess(
  blankStringToUndefined,
  z
    .string()
    .trim()
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .optional(),
);

const reasonSchema = z.string().trim().min(1).max(500);

export const adminOrderListQuerySchema = z
  .object({
    status: optionalOrderStatusSchema,
    paymentStatus: optionalPaymentStatusSchema,
    customerType: optionalCustomerTypeSchema,
    orderNumber: optionalSearchTextSchema,
    customerPhone: optionalSearchTextSchema,
    createdFrom: optionalDateSchema,
    createdTo: optionalDateSchema,
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict()
  .superRefine((input, context) => {
    if (
      input.createdFrom &&
      input.createdTo &&
      input.createdFrom > input.createdTo
    ) {
      context.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "End date must be after start date.",
      });
    }
  });

export const orderNumberParamSchema = z.object({
  orderNumber: z.string().trim().min(1).max(80),
});

export const orderStatusUpdateSchema = z
  .object({
    status: orderStatusSchema,
    reason: reasonSchema.optional(),
    adminNote: z.string().trim().max(1_000).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (
      (input.status === OrderStatus.CANCELLED ||
        input.status === OrderStatus.REJECTED) &&
      !input.reason
    ) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Enter the reason for this protected status change.",
      });
    }
  });

export const orderAdminNoteUpdateSchema = z
  .object({
    adminNote: z.string().trim().max(1_000).nullable(),
  })
  .strict();

export type AdminOrderListQueryInput = z.infer<
  typeof adminOrderListQuerySchema
>;
export type OrderStatusUpdateInput = z.infer<
  typeof orderStatusUpdateSchema
>;
export type OrderAdminNoteUpdateInput = z.infer<
  typeof orderAdminNoteUpdateSchema
>;
