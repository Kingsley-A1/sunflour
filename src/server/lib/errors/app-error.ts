import { ERROR_CODES } from "@/server/lib/errors/codes";

export interface AppErrorOptions {
  code: string;
  publicMessage: string;
  status?: number;
  fieldErrors?: Record<string, string[]>;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly publicMessage: string;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  override readonly cause?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.publicMessage);
    this.name = "AppError";
    this.code = options.code;
    this.publicMessage = options.publicMessage;
    this.status = options.status ?? 500;
    this.fieldErrors = options.fieldErrors;
    this.cause = options.cause;
  }
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function getPrismaConstraintFields(error: unknown): string[] {
  if (
    typeof error !== "object" ||
    error === null ||
    !("meta" in error) ||
    typeof (error as { meta?: unknown }).meta !== "object" ||
    (error as { meta?: unknown }).meta === null
  ) {
    return [];
  }

  const target = ((error as { meta: { target?: unknown } }).meta).target;

  if (Array.isArray(target)) {
    return target.filter((field): field is string => typeof field === "string");
  }

  return typeof target === "string" ? [target] : [];
}

function uniqueConstraintError(error: unknown): AppError {
  const fields = getPrismaConstraintFields(error);
  const fieldErrors =
    fields.length > 0
      ? Object.fromEntries(
          fields.map((field) => [field, ["This value is already in use."]]),
        )
      : undefined;

  return new AppError({
    code: ERROR_CODES.CONFLICT,
    publicMessage: "A record already exists with this value.",
    status: 409,
    fieldErrors,
    cause: error,
  });
}

export function errorFromUnknown(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (hasPrismaCode(error, "P2002")) {
    return uniqueConstraintError(error);
  }

  if (hasPrismaCode(error, "P2025")) {
    return new AppError({
      code: ERROR_CODES.NOT_FOUND,
      publicMessage: "The requested record was not found.",
      status: 404,
      cause: error,
    });
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    publicMessage: "Something went wrong. Try again.",
    status: 500,
    cause: error,
  });
}
