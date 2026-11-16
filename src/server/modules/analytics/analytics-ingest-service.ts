import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import {
  classifyTrafficSource,
  isLikelyBot,
  normalizeEventPath,
  parseUserAgent,
} from "./analytics-classify";
import type { SiteEventBatchInput } from "./analytics-schemas";

/** Events older than this are deleted; long enough for year-on-year views. */
export const SITE_EVENT_RETENTION_DAYS = 400;
const MAX_CLIENT_SKEW_MS = 10 * 60_000;
const PRUNE_PROBABILITY = 0.005;

export interface SiteEventRequestContext {
  userAgent: string | null;
  siteHost: string | null;
  /** Staff browsing the storefront should not skew customer numbers. */
  isStaff: boolean;
  now?: Date;
  random?: () => number;
}

export interface RecordSiteEventsResult {
  accepted: number;
  ignoredReason?: "bot" | "staff";
}

/**
 * Turns a validated browser batch into stored rows. The server clock is the
 * authority for time; the client clock is only used to keep the order of
 * events inside the batch (and is clamped so a wrong phone clock can't move
 * events into another day).
 */
export function buildSiteEventRows(
  input: SiteEventBatchInput,
  context: Pick<SiteEventRequestContext, "userAgent" | "siteHost"> & { now: Date },
): Prisma.SiteEventCreateManyInput[] {
  const { source, referrerHost } = classifyTrafficSource({
    referrer: input.referrer,
    utmSource: input.utmSource,
    siteHost: context.siteHost,
  });
  const device = parseUserAgent(context.userAgent);
  const nowMs = context.now.getTime();

  return input.events.map((event) => {
    const ageMs = Math.min(
      MAX_CLIENT_SKEW_MS,
      Math.max(0, input.sentAt - event.at),
    );
    const label =
      event.name === "search" ? event.label?.toLowerCase() : event.label;
    const text = (value: string | undefined) => value || null;

    return {
      occurredAt: new Date(nowMs - ageMs),
      visitorId: input.visitorId,
      sessionId: input.sessionId,
      name: event.name,
      path: normalizeEventPath(event.path),
      source,
      referrerHost,
      utmCampaign: text(input.utmCampaign?.toLowerCase()),
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      productId: text(event.productId),
      productSlug: text(event.productSlug),
      orderNumber: text(event.orderNumber),
      valueKobo: event.valueKobo ?? null,
      label: text(label),
      metadata: event.metadata ?? undefined,
    };
  });
}

export async function recordSiteEvents(
  input: SiteEventBatchInput,
  context: SiteEventRequestContext,
): Promise<RecordSiteEventsResult> {
  if (isLikelyBot(context.userAgent)) {
    return { accepted: 0, ignoredReason: "bot" };
  }

  if (context.isStaff) {
    return { accepted: 0, ignoredReason: "staff" };
  }

  const now = context.now ?? new Date();
  const rows = buildSiteEventRows(input, { ...context, now });
  await prisma.siteEvent.createMany({ data: rows });

  // Cheap, self-maintaining retention: roughly 1 in 200 batches prunes old
  // rows, so no cron job is needed for a table of this size.
  if ((context.random ?? Math.random)() < PRUNE_PROBABILITY) {
    await pruneSiteEvents(now).catch(() => undefined);
  }

  return { accepted: rows.length };
}

export async function pruneSiteEvents(now = new Date()): Promise<number> {
  const cutoff = new Date(
    now.getTime() - SITE_EVENT_RETENTION_DAYS * 24 * 60 * 60_000,
  );
  const result = await prisma.siteEvent.deleteMany({
    where: { occurredAt: { lt: cutoff } },
  });
  return result.count;
}
