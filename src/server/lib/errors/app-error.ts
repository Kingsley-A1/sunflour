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

export function errorFromUnknown(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    publicMessage: "Something went wrong. Try again.",
    status: 500,
    cause: error,
  });
}
