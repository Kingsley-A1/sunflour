import { z } from "zod";
import { SITE_EVENT_NAMES } from "./analytics-events";

const shortText = (max: number) => z.string().trim().max(max);
/** Empty strings are allowed here and stored as null by the ingest service. */
const optionalShortText = (max: number) => z.string().trim().max(max).optional();

const browserId = z
  .string()
  .regex(/^[A-Za-z0-9-]{8,64}$/, "Must be a random browser identifier.");

const metadataValue = z.union([
  z.string().max(120),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const siteEventInputSchema = z.object({
  name: z.enum(SITE_EVENT_NAMES),
  path: shortText(500).startsWith("/"),
  /** Client clock (ms) — used only to keep event order inside a batch. */
  at: z.number().int().nonnegative(),
  productId: optionalShortText(64),
  productSlug: optionalShortText(160),
  orderNumber: optionalShortText(40),
  valueKobo: z.number().int().min(0).max(2_000_000_000).optional(),
  label: optionalShortText(80),
  metadata: z
    .record(z.string().max(40), metadataValue)
    .refine((value) => Object.keys(value).length <= 8, "Too many fields.")
    .optional(),
});

export const siteEventBatchSchema = z.object({
  visitorId: browserId,
  sessionId: browserId,
  /** Client clock (ms) when the batch was sent. */
  sentAt: z.number().int().nonnegative(),
  referrer: optionalShortText(500),
  utmSource: optionalShortText(80),
  utmCampaign: optionalShortText(80),
  events: z.array(siteEventInputSchema).min(1).max(25),
});

export type SiteEventInput = z.infer<typeof siteEventInputSchema>;
export type SiteEventBatchInput = z.infer<typeof siteEventBatchSchema>;

export const ANALYTICS_RANGES = ["today", "7d", "30d", "90d"] as const;
export type AnalyticsRangeKey = (typeof ANALYTICS_RANGES)[number];

export const analyticsReportQuerySchema = z.object({
  range: z.enum(ANALYTICS_RANGES).default("7d"),
});

export type AnalyticsReportQueryInput = z.infer<
  typeof analyticsReportQuerySchema
>;
