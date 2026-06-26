import { z } from "zod";

/**
 * In-progress product form state for resumable drafts. Every field is optional
 * because a draft can be saved at any point during product creation. Values are
 * stored as the raw form representation (for example naira strings) so the
 * editor can rehydrate exactly what the admin had typed. Images are not stored
 * here because file selections cannot be serialised; they are re-selected on
 * resume.
 */
export const productDraftDataSchema = z.object({
  name: z.string().max(200).optional(),
  slug: z.string().max(200).optional(),
  categoryId: z.string().max(120).optional(),
  description: z.string().max(5_000).optional(),
  basePrice: z.string().max(40).optional(),
  status: z.string().max(40).optional(),
  showWhenOutOfStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  variantName: z.string().max(200).optional(),
  variantPrice: z.string().max(40).optional(),
});

export const productDraftInputSchema = z
  .object({
    name: z.string().trim().max(200).optional(),
    data: productDraftDataSchema,
  })
  .strict();

export const productDraftIdParamSchema = z.object({
  id: z.string().min(1),
});

export type ProductDraftData = z.infer<typeof productDraftDataSchema>;
export type ProductDraftInput = z.infer<typeof productDraftInputSchema>;
