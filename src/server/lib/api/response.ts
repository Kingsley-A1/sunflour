import { NextResponse } from "next/server";
import type { AppError } from "@/server/lib/errors/app-error";
import { errorFromUnknown } from "@/server/lib/errors/app-error";
import { logApiError } from "@/server/lib/observability";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export function apiSuccess<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(
  error: AppError | unknown,
  init?: ResponseInit,
): NextResponse<ApiErrorBody> {
  const appError = errorFromUnknown(error);
  logApiError(appError);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: appError.code,
        message: appError.publicMessage,
        fieldErrors: appError.fieldErrors,
      },
    },
    {
      status: appError.status,
      ...init,
    },
  );
}
