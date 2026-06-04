import { z } from "zod";
import { ProductStatus } from "@/generated/prisma/enums";

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
const descriptionSchema = z.string().trim().max(2_000).optional().nullable();
const sortOrderSchema = z.number().int().min(0).max(10_000).optional();
const moneySchema = z.number().int().min(0).max(50_000_000);
const productStatusSchema = z.enum([
  ProductStatus.ACTIVE,
  ProductStatus.HIDDEN,
  ProductStatus.OUT_OF_STOCK,
]);

export const categoryCreateSchema = z
  .object({
    name: nameSchema,
    slug: slugSchema.optional(),
    description: descriptionSchema,
    sortOrder: sortOrderSchema,
    isActive: z.boolean().optional(),
  })
  .strict();

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const productVariantCreateSchema = z
  .object({
    name: nameSchema,
    price: moneySchema,
    sku: z.string().trim().min(1).max(80).optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: sortOrderSchema,
  })
  .strict();

export const productVariantUpdateSchema =
  productVariantCreateSchema.partial();

export const productCreateSchema = z
  .object({
    categoryId: z.string().min(1),
    name: nameSchema,
    slug: slugSchema.optional(),
    description: descriptionSchema,
    basePrice: moneySchema,
    status: productStatusSchema.optional(),
    showWhenOutOfStock: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isPopular: z.boolean().optional(),
    sortOrder: sortOrderSchema,
    variants: z.array(productVariantCreateSchema).max(24).optional(),
  })
  .strict();

export const productUpdateSchema = productCreateSchema
  .omit({
    variants: true,
  })
  .partial();

export const productStatusUpdateSchema = z
  .object({
    status: productStatusSchema,
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const productImageCreateSchema = z
  .object({
    mediaAssetId: z.string().min(1),
    altText: z.string().trim().max(250).optional().nullable(),
    isPrimary: z.boolean().optional(),
    sortOrder: sortOrderSchema,
  })
  .strict();

const homepageHeroProductItemSchema = z
  .object({
    productId: z.string().min(1),
    sortOrder: z.number().int().min(0).max(10_000),
    isActive: z.boolean().optional(),
  })
  .strict();

export const homepageHeroProductUpdateSchema = z
  .object({
    items: z
      .array(homepageHeroProductItemSchema)
      .max(8, "Choose no more than 8 hero product placements."),
  })
  .strict()
  .superRefine((input, context) => {
    const productIds = new Set<string>();

    input.items.forEach((item, index) => {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: "custom",
          message: "Choose each product only once.",
          path: ["items", index, "productId"],
        });
      }

      productIds.add(item.productId);
    });
  });

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const slugParamSchema = z.object({
  slug: slugSchema,
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductVariantCreateInput = z.infer<
  typeof productVariantCreateSchema
>;
export type ProductVariantUpdateInput = z.infer<
  typeof productVariantUpdateSchema
>;
export type ProductStatusUpdateInput = z.infer<
  typeof productStatusUpdateSchema
>;
export type ProductImageCreateInput = z.infer<
  typeof productImageCreateSchema
>;
export type HomepageHeroProductUpdateInput = z.infer<
  typeof homepageHeroProductUpdateSchema
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
  const slug = input.slug ?? slugify(input.name);
  return slugSchema.parse(slug);
}
