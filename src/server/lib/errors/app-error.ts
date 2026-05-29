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

export function errorFromUnknown(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (hasPrismaCode(error, "P2025")) {
    return new AppError({
      code: "NOT_FOUND",
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
