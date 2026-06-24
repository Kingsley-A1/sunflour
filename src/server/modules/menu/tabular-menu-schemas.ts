import { z } from "zod";

const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function blankStringToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function requiredTrimmedString(max: number, message: string) {
  return z.string().trim().min(1, message).max(max);
}

function optionalLabel(max: number) {
  return z.preprocess(
    blankStringToNull,
    z.string().trim().max(max).nullable(),
  );
}

const stringListSchema = (maxItems: number, maxLength: number) =>
  z.array(requiredTrimmedString(maxLength, "Enter a value.")).max(maxItems);

export const tabularMenuPriceSchema = z
  .object({
    id: requiredTrimmedString(80, "Enter the price row ID.").regex(
      identifierPattern,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
    label: optionalLabel(80),
    amount: z
      .number({
        error: "Enter a valid NGN amount.",
      })
      .int("Enter a whole-number amount in kobo.")
      .min(0, "Amount cannot be negative."),
    sortOrder: z
      .number({
        error: "Enter a valid price sort order.",
      })
      .int("Price sort order must be a whole number.")
      .min(0, "Price sort order cannot be negative.")
      .max(999),
  })
  .strict();

export const tabularMenuCategorySchema = z
  .object({
    id: requiredTrimmedString(80, "Enter the category ID.").regex(
      identifierPattern,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
    label: requiredTrimmedString(80, "Enter the category label."),
    summary: requiredTrimmedString(180, "Enter the category summary."),
    sortOrder: z
      .number({
        error: "Enter a valid category sort order.",
      })
      .int("Category sort order must be a whole number.")
      .min(0, "Category sort order cannot be negative.")
      .max(999),
  })
  .strict();

export const tabularMenuItemSchema = z
  .object({
    id: requiredTrimmedString(80, "Enter the item ID.").regex(
      identifierPattern,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
    categoryId: requiredTrimmedString(80, "Choose a category.").regex(
      identifierPattern,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
    name: requiredTrimmedString(120, "Enter the item name."),
    description: requiredTrimmedString(220, "Enter the short description."),
    details: requiredTrimmedString(400, "Enter the item details."),
    imageUrl: requiredTrimmedString(600, "Enter the image URL.").url(
      "Enter a valid image URL.",
    ),
    imageAlt: requiredTrimmedString(180, "Enter the image alt text."),
    prices: z.array(tabularMenuPriceSchema).min(1).max(8),
    tags: stringListSchema(8, 40),
    ingredients: stringListSchema(16, 60),
    sortOrder: z
      .number({
        error: "Enter a valid item sort order.",
      })
      .int("Item sort order must be a whole number.")
      .min(0, "Item sort order cannot be negative.")
      .max(9_999),
  })
  .strict();

export const tabularMenuContentValueSchema = z
  .object({
    categories: z.array(tabularMenuCategorySchema).min(1).max(24),
    items: z.array(tabularMenuItemSchema).min(1).max(400),
  })
  .strict()
  .superRefine((value, ctx) => {
    const categoryIds = new Set<string>();
    const itemIds = new Set<string>();

    value.categories.forEach((category, index) => {
      if (categoryIds.has(category.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Category IDs must be unique.",
          path: ["categories", index, "id"],
        });
      }

      categoryIds.add(category.id);
    });

    value.items.forEach((item, itemIndex) => {
      if (itemIds.has(item.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Item IDs must be unique.",
          path: ["items", itemIndex, "id"],
        });
      }

      itemIds.add(item.id);

      if (!categoryIds.has(item.categoryId)) {
        ctx.addIssue({
          code: "custom",
          message: "Every item must reference an existing category.",
          path: ["items", itemIndex, "categoryId"],
        });
      }

      const priceIds = new Set<string>();

      item.prices.forEach((price, priceIndex) => {
        if (priceIds.has(price.id)) {
          ctx.addIssue({
            code: "custom",
            message: "Price row IDs must be unique within each item.",
            path: ["items", itemIndex, "prices", priceIndex, "id"],
          });
        }

        priceIds.add(price.id);
      });
    });
  });

export const tabularMenuContentUpdateSchema = tabularMenuContentValueSchema;

export type TabularMenuPriceValue = z.infer<typeof tabularMenuPriceSchema>;
export type TabularMenuCategoryValue = z.infer<
  typeof tabularMenuCategorySchema
>;
export type TabularMenuItemValue = z.infer<typeof tabularMenuItemSchema>;
export type TabularMenuContentValue = z.infer<
  typeof tabularMenuContentValueSchema
>;
export type TabularMenuContentUpdateInput = z.infer<
  typeof tabularMenuContentUpdateSchema
>;
