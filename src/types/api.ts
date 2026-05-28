export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface ApiClientErrorDetail {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  status: number;
}

export class ApiClientError extends Error {
  code: string;
  fieldErrors?: Record<string, string[]>;
  status: number;

  constructor(detail: ApiClientErrorDetail) {
    super(detail.message);
    this.name = "ApiClientError";
    this.code = detail.code;
    this.fieldErrors = detail.fieldErrors;
    this.status = detail.status;
  }
}
