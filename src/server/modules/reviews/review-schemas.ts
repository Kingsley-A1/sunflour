import { z } from "zod";
import { ReviewStatus } from "@/generated/prisma/enums";

const reviewStatusSchema = z.enum([
  ReviewStatus.PENDING,
  ReviewStatus.APPROVED,
  ReviewStatus.REJECTED,
  ReviewStatus.HIDDEN,
]);

export const publicReviewListQuerySchema = z
  .object({
    productId: z.string().trim().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const publicReviewCreateSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(10).max(1_000),
    productId: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const adminReviewListQuerySchema = z
  .object({
    status: reviewStatusSchema.optional(),
    productId: z.string().trim().min(1).max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const reviewIdParamSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export const reviewModerationSchema = z
  .object({
    status: z.enum([
      ReviewStatus.APPROVED,
      ReviewStatus.REJECTED,
      ReviewStatus.HIDDEN,
    ]),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (
      (input.status === ReviewStatus.REJECTED ||
        input.status === ReviewStatus.HIDDEN) &&
      !input.reason
    ) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Enter the moderation reason.",
      });
    }
  });

export type PublicReviewListQueryInput = z.infer<
  typeof publicReviewListQuerySchema
>;
export type PublicReviewCreateInput = z.infer<
  typeof publicReviewCreateSchema
>;
export type AdminReviewListQueryInput = z.infer<
  typeof adminReviewListQuerySchema
>;
export type ReviewModerationInput = z.infer<typeof reviewModerationSchema>;
