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

export function logApiError(error: AppError): void {
  if (error.status < 500) {
    return;
  }

  writeLog("error", "api.error", {
    code: error.code,
    status: error.status,
    message: error.publicMessage,
  });
}

export function logRateLimit(key: string): void {
  writeLog("warn", "api.rate_limited", {
    key,
  });
}
