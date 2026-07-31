import { z } from "zod";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.");

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Choose an image.")
  .max(1_200)
  .refine(
    (value) => value.startsWith("/") || z.url().safeParse(value).success,
    "Use a site path or a valid public image URL.",
  );

const internalHrefSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^\/(?!\/)/, "Use a relative Sunflour link beginning with /.");

export const homepageCarouselSlideSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(120),
    imageUrl: imageUrlSchema,
    altText: z.string().trim().min(1).max(250),
    href: internalHrefSchema,
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(10_000),
  })
  .strict();

export const homepageCarouselSettingsSchema = z
  .object({
    slides: z
      .array(homepageCarouselSlideSchema)
      .min(1, "Add at least one carousel slide.")
      .max(20, "Use no more than 20 carousel slides."),
  })
  .strict()
  .superRefine((input, context) => {
    const ids = new Set<string>();

    input.slides.forEach((slide, index) => {
      if (ids.has(slide.id)) {
        context.addIssue({
          code: "custom",
          path: ["slides", index, "id"],
          message: "Each carousel slide must have a unique id.",
        });
      }
      ids.add(slide.id);
    });
  });

export const weeklySaleSettingsSchema = z
  .object({
    productId: z.string().trim().min(1, "Choose the sale product."),
    discountPercent: z
      .number()
      .int()
      .min(1, "Discount must be at least 1%.")
      .max(90, "Discount cannot exceed 90%."),
    weekStart: dateKeySchema,
    weekEnd: dateKeySchema,
    bannerImageUrl: imageUrlSchema,
    cardImageUrl: imageUrlSchema,
    isActive: z.boolean(),
  })
  .strict()
  .superRefine((input, context) => {
    const start = Date.parse(`${input.weekStart}T00:00:00.000Z`);
    const end = Date.parse(`${input.weekEnd}T00:00:00.000Z`);
    const expectedEnd = start + 6 * 24 * 60 * 60 * 1_000;

    if (!Number.isFinite(start) || !Number.isFinite(end) || end !== expectedEnd) {
      context.addIssue({
        code: "custom",
        path: ["weekEnd"],
        message: "A weekly sale must cover exactly 7 calendar days.",
      });
    }
  });

export const homepageCarouselUpdateSchema = z
  .object({
    carousel: homepageCarouselSettingsSchema,
  })
  .strict();

export const weeklySaleUpdateSchema = z
  .object({
    weeklySale: weeklySaleSettingsSchema,
  })
  .strict();

export type HomepageCarouselSettings = z.infer<
  typeof homepageCarouselSettingsSchema
>;
export type HomepageCarouselUpdateInput = z.infer<
  typeof homepageCarouselUpdateSchema
>;
export type WeeklySaleSettingsValue = z.infer<
  typeof weeklySaleSettingsSchema
>;
export type WeeklySaleUpdateInput = z.infer<typeof weeklySaleUpdateSchema>;
