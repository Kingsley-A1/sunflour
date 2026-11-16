import type { AppError } from "@/server/lib/errors/app-error";

type LogLevel = "info" | "warn" | "error";

interface LogFields {
  [key: string]: string | number | boolean | null | undefined;
}

function writeLog(level: LogLevel, event: string, fields: LogFields): void {
  const payload = {
    event,
    level,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}

function readField(source: unknown, key: string): unknown {
  return typeof source === "object" && source !== null && key in source
    ? (source as Record<string, unknown>)[key]
    : undefined;
}

function scalar(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

/**
 * Safe, non-secret facts about what caused a server error: the error class,
 * its code (Prisma/S3/Node) and upstream HTTP status. Without this, every
 * storage or database failure logged identically and could not be diagnosed.
 */
function describeCause(cause: unknown): LogFields {
  if (cause === undefined || cause === null) {
    return {};
  }

  const metadata = readField(cause, "$metadata");

  return {
    causeName: scalar(readField(cause, "name")),
    causeCode:
      scalar(readField(cause, "code")) ?? scalar(readField(cause, "Code")),
    causeHttpStatus:
      scalar(readField(cause, "httpStatus")) ??
      scalar(readField(metadata, "httpStatusCode")),
  };
}

export function logApiError(error: AppError): void {
  if (error.status < 500) {
    return;
  }

  writeLog("error", "api.error", {
    code: error.code,
    status: error.status,
    message: error.publicMessage,
    ...describeCause(error.cause),
  });
}

/** For server-rendered admin loaders that degrade gracefully instead of throwing. */
export function logLoaderError(loader: string, error: unknown): void {
  writeLog("error", "loader.error", {
    loader,
    ...describeCause(error),
  });
}

export function logRateLimit(key: string): void {
  writeLog("warn", "api.rate_limited", {
    key,
  });
}
