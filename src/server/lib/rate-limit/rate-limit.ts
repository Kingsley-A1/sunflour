import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";
import { logRateLimit } from "@/server/lib/observability";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

const buckets = new Map<string, RateLimitBucket>();

function getNowMs(now?: Date): number {
  return now?.getTime() ?? Date.now();
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const nowMs = getNowMs(options.now);
  const bucket = buckets.get(options.key);

  if (!bucket || bucket.resetAt <= nowMs) {
    const resetAt = nowMs + options.windowMs;
    buckets.set(options.key, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      resetAt: new Date(resetAt),
    };
  }

  bucket.count += 1;

  return {
    allowed: bucket.count <= options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
    resetAt: new Date(bucket.resetAt),
  };
}

export function enforceRateLimit(options: RateLimitOptions): RateLimitResult {
  const result = checkRateLimit(options);

  if (!result.allowed) {
    logRateLimit(options.key);

    throw new AppError({
      code: ERROR_CODES.RATE_LIMITED,
      publicMessage: "Too many requests. Try again shortly.",
      status: 429,
    });
  }

  return result;
}

export function clearRateLimitBuckets(): void {
  buckets.clear();
}
