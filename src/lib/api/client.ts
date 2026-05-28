import { ApiClientError, type ApiResponse } from "@/types/api";
import type {
  CheckoutResult,
  DeliveryMethod,
  DeliveryQuote,
  DeliveryZone,
} from "@/types/domain";

interface ApiRequestOptions extends RequestInit {
  fieldName?: string;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!payload) {
    throw new ApiClientError({
      code: "INVALID_RESPONSE",
      message: "The server returned an unreadable response.",
      status: response.status,
    });
  }

  if (!payload.ok) {
    throw new ApiClientError({
      code: payload.error.code,
      message: payload.error.message,
      fieldErrors: payload.error.fieldErrors,
      status: response.status,
    });
  }

  return payload.data;
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const data = await apiRequest<{ zones: DeliveryZone[] }>(
    "/api/v1/public/delivery/zones",
  );

  return data.zones;
}

export async function quoteDelivery(input: {
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string;
}): Promise<DeliveryQuote> {
  return apiRequest<DeliveryQuote>("/api/v1/public/delivery/quote", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface CheckoutPayload {
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  delivery: {
    method: DeliveryMethod;
    zoneId?: string;
    address?: string;
  };
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  customerNote?: string;
}

export async function createCheckoutOrder(
  payload: CheckoutPayload,
  idempotencyKey: string,
): Promise<CheckoutResult> {
  return apiRequest<CheckoutResult>("/api/v1/public/checkout", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}
