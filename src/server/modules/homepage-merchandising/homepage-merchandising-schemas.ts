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

/**
 * A weekly offer is a "buy this, get that free" deal (e.g. "Lebanese Burger +
 * Free Coke"). It never changes product pricing — the free item is honoured by
 * staff when the order is fulfilled.
 */
export const weeklyOfferSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    // The product the customer buys to qualify for the offer.
    purchaseProductId: z.string().trim().min(1, "Choose the qualifying product."),
    // What they get free. Free text so it can cover items that are not
    // catalogue products (a bottled drink, a sachet, etc).
    freeItemLabel: z
      .string()
      .trim()
      .min(1, "Describe the free item, e.g. Free Coke.")
      .max(120),
    headline: z.string().trim().min(1, "Add a short headline.").max(140),
    description: z.string().trim().max(500).optional(),
    weekStart: dateKeySchema,
    weekEnd: dateKeySchema,
    bannerImageUrl: imageUrlSchema,
    cardImageUrl: imageUrlSchema,
    isActive: z.boolean(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.weekEnd < input.weekStart) {
      context.addIssue({
        code: "custom",
        path: ["weekEnd"],
        message: "The offer must end on or after it starts.",
      });
    }
  });

export const weeklyOfferSettingsSchema = z
  .object({
    offers: z.array(weeklyOfferSchema).max(200),
  })
  .strict()
  .superRefine((input, context) => {
    const ids = new Set<string>();

    input.offers.forEach((offer, index) => {
      if (ids.has(offer.id)) {
        context.addIssue({
          code: "custom",
          path: ["offers", index, "id"],
          message: "Each weekly offer must have a unique id.",
        });
      }
      ids.add(offer.id);
    });

    // Active offers must not overlap, so "the current offer" is unambiguous.
    // Inactive (draft) offers are allowed to collide freely.
    const active = input.offers
      .map((offer, index) => ({ offer, index }))
      .filter((entry) => entry.offer.isActive);

    active.forEach((entry, position) => {
      const clash = active.slice(0, position).find(
        (other) =>
          entry.offer.weekStart <= other.offer.weekEnd &&
          other.offer.weekStart <= entry.offer.weekEnd,
      );

      if (clash) {
        context.addIssue({
          code: "custom",
          path: ["offers", entry.index, "weekStart"],
          message: `This offer overlaps "${clash.offer.headline}". Choose dates that do not collide.`,
        });
      }
    });
  });

export const homepageCarouselUpdateSchema = z
  .object({
    carousel: homepageCarouselSettingsSchema,
  })
  .strict();

export const weeklyOfferUpdateSchema = z
  .object({
    weeklyOffers: weeklyOfferSettingsSchema,
  })
  .strict();

export type HomepageCarouselSettings = z.infer<
  typeof homepageCarouselSettingsSchema
>;
export type HomepageCarouselUpdateInput = z.infer<
  typeof homepageCarouselUpdateSchema
>;
export type WeeklyOfferValue = z.infer<typeof weeklyOfferSchema>;
export type WeeklyOfferSettingsValue = z.infer<
  typeof weeklyOfferSettingsSchema
>;
export type WeeklyOfferUpdateInput = z.infer<typeof weeklyOfferUpdateSchema>;
