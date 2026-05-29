import { z } from "zod";

const optionalTextSchema = z.string().trim().min(1).max(160).optional();

const optionalDateSchema = z
  .string()
  .trim()
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .optional();

export const auditLogListQuerySchema = z
  .object({
    actorUserId: optionalTextSchema,
    action: optionalTextSchema,
    targetType: optionalTextSchema,
    targetId: optionalTextSchema,
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

export type AuditLogListQueryInput = z.infer<
  typeof auditLogListQuerySchema
>;
