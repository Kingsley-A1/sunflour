import { z } from "zod";

const optionalDateSchema = z
  .string()
  .trim()
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .optional();

export const dashboardMetricsQuerySchema = z
  .object({
    from: optionalDateSchema,
    to: optionalDateSchema,
  })
  .strict()
  .superRefine((input, context) => {
    if (input.from && input.to && input.from >= input.to) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "End date must be after start date.",
      });
    }
  });

export type DashboardMetricsQueryInput = z.infer<
  typeof dashboardMetricsQuerySchema
>;
