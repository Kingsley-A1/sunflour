import { AppError } from "@/server/lib/errors/app-error";
import { ERROR_CODES } from "@/server/lib/errors/codes";

/**
 * Translates a failure from the R2 (S3-compatible) client into an AppError
 * that tells the admin what actually broke. Before this existed every storage
 * failure surfaced as a generic error and was easy to mistake for the admin's
 * own connection.
 *
 * Only safe, non-secret facts (error name, S3 code, HTTP status) are kept on
 * the error `cause` so the server log can name the real problem.
 */

interface StorageErrorShape {
  name?: unknown;
  code?: unknown;
  Code?: unknown;
  message?: unknown;
  $metadata?: { httpStatusCode?: unknown };
}

const CREDENTIAL_ERRORS = new Set([
  "InvalidAccessKeyId",
  "SignatureDoesNotMatch",
  "AccessDenied",
  "Unauthorized",
  "InvalidToken",
  "ExpiredToken",
  "CredentialsProviderError",
]);

const BUCKET_ERRORS = new Set(["NoSuchBucket", "InvalidBucketName"]);

const TRANSIENT_ERRORS = new Set([
  "TimeoutError",
  "RequestTimeout",
  "RequestTimeoutException",
  "ServiceUnavailable",
  "SlowDown",
  "InternalError",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
]);

export interface StorageErrorSummary {
  name: string | null;
  code: string | null;
  httpStatus: number | null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function summarizeStorageError(error: unknown): StorageErrorSummary {
  if (typeof error !== "object" || error === null) {
    return { name: null, code: null, httpStatus: null };
  }

  const shape = error as StorageErrorShape;
  const httpStatus = shape.$metadata?.httpStatusCode;

  return {
    name: asString(shape.name),
    code: asString(shape.Code) ?? asString(shape.code),
    httpStatus: typeof httpStatus === "number" ? httpStatus : null,
  };
}

export function storageErrorFromUnknown(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const summary = summarizeStorageError(error);
  const identifiers = [summary.name, summary.code].filter(
    (value): value is string => Boolean(value),
  );
  const matches = (set: Set<string>) =>
    identifiers.some((identifier) => set.has(identifier));

  if (
    matches(CREDENTIAL_ERRORS) ||
    summary.httpStatus === 401 ||
    summary.httpStatus === 403
  ) {
    return new AppError({
      code: ERROR_CODES.STORAGE_MISCONFIGURED,
      publicMessage:
        "Image storage rejected the upload (access denied). A super admin needs to check the R2 access keys in the hosting settings. Your connection is fine.",
      status: 502,
      cause: summary,
    });
  }

  if (matches(BUCKET_ERRORS) || summary.httpStatus === 404) {
    return new AppError({
      code: ERROR_CODES.STORAGE_MISCONFIGURED,
      publicMessage:
        "Image storage bucket was not found. A super admin needs to check the R2 bucket name in the hosting settings. Your connection is fine.",
      status: 502,
      cause: summary,
    });
  }

  if (
    matches(TRANSIENT_ERRORS) ||
    (summary.httpStatus !== null && summary.httpStatus >= 500)
  ) {
    return new AppError({
      code: ERROR_CODES.STORAGE_UNAVAILABLE,
      publicMessage:
        "Image storage did not respond in time. This is a storage-side delay, not your connection. Retry the image.",
      status: 503,
      cause: summary,
    });
  }

  return new AppError({
    code: ERROR_CODES.STORAGE_UPLOAD_FAILED,
    publicMessage:
      "Image storage refused this upload. Retry once; if it keeps failing, a super admin should check the storage logs.",
    status: 502,
    cause: summary,
  });
}
