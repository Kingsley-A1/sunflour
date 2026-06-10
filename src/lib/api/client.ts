import { ApiClientError, type ApiResponse } from "@/types/api";
import type {
  AdminDeliveryZone,
  AdminRegistrationCodePanel,
  AdminRegistrationResult,
  AdminHomepageHeroProduct,
  AdminSurchargeRule,
  AdminProduct,
  CheckoutResult,
  CustomerProfileResponse,
  DeliveryMethod,
  DeliveryQuote,
  DeliveryZone,
  EmailTemplate,
  PaymentSettings,
  ProductStatus,
  ReviewStatus,
  SafeAuthUser,
  UserRole,
} from "@/types/domain";

interface ApiRequestOptions extends RequestInit {
  fieldName?: string;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiClientError({
      code: "NETWORK_ERROR",
      message: "Network connection failed. Check your connection and try again.",
      status: 0,
    });
  }

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

const friendlyErrorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Check the highlighted fields and try again.",
  UNAUTHORIZED: "Sign in to continue.",
  FORBIDDEN: "Your account does not have permission to perform this action.",
  NOT_FOUND: "The requested record could not be found.",
  RATE_LIMITED: "Too many attempts. Wait a moment, then try again.",
  IDEMPOTENCY_CONFLICT:
    "This checkout attempt conflicts with an earlier request. Refresh the page before trying again.",
  PAYMENT_SETTINGS_UNAVAILABLE:
    "Payment setup is not available yet. Sunflour needs to configure transfer instructions before checkout can continue.",
  DELIVERY_ZONE_UNAVAILABLE:
    "Delivery is not available for the selected location. Choose another zone or pickup.",
  CHECKOUT_ITEM_UNAVAILABLE:
    "One or more cart items changed or became unavailable. Review your cart before trying again.",
  INVALID_ORDER_STATUS_TRANSITION:
    "That order status change is not allowed by the backend lifecycle rules.",
  INVALID_PAYMENT_STATUS_TRANSITION:
    "That payment status change is not allowed by the backend payment rules.",
  NETWORK_ERROR: "Network connection failed. Check your connection and try again.",
  INVALID_RESPONSE: "The server returned an unreadable response.",
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (error instanceof ApiClientError) {
    return friendlyErrorMessages[error.code] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function getApiFieldError(
  fieldErrors: Record<string, string[]> | undefined,
  ...fieldNames: string[]
): string | undefined {
  if (!fieldErrors) {
    return undefined;
  }

  for (const fieldName of fieldNames) {
    const message = fieldErrors[fieldName]?.[0];

    if (message) {
      return message;
    }
  }

  return undefined;
}

export async function registerCustomerAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<SafeAuthUser> {
  const data = await apiRequest<{ user: SafeAuthUser }>(
    "/api/v1/public/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return data.user;
}

export async function registerAdminAccount(input: {
  fullName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "CUSTOMER">;
  registrationCode: string;
}): Promise<AdminRegistrationResult> {
  return apiRequest<AdminRegistrationResult>(
    "/api/v1/public/auth/admin-register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function getAdminRegistrationCodes(): Promise<AdminRegistrationCodePanel> {
  const data = await apiRequest<{
    registrationCodes: AdminRegistrationCodePanel;
  }>("/api/v1/admin/admin-registration-codes");

  return data.registrationCodes;
}

export async function rotateAdminRegistrationCodes(): Promise<AdminRegistrationCodePanel> {
  const data = await apiRequest<{
    registrationCodes: AdminRegistrationCodePanel;
  }>("/api/v1/admin/admin-registration-codes", {
    method: "POST",
    body: JSON.stringify({
      confirmation: "ROTATE_ADMIN_REGISTRATION_CODES",
    }),
  });

  return data.registrationCodes;
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<{ message: string }> {
  return apiRequest("/api/v1/public/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function confirmPasswordReset(input: {
  email: string;
  token: string;
  password: string;
}): Promise<{ message: string }> {
  return apiRequest("/api/v1/public/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
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

export async function submitPublicReview(input: {
  customerName: string;
  rating: number;
  comment: string;
  productId?: string;
}): Promise<{ review: { id: string; status: "PENDING"; createdAt: string } }> {
  return apiRequest("/api/v1/public/reviews", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCustomerProfile(input: {
  fullName: string;
  phone: string;
}): Promise<CustomerProfileResponse> {
  return apiRequest("/api/v1/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createAdminCategory(input: {
  name: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return apiRequest("/api/v1/admin/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminCategory(
  categoryId: string,
  input: Partial<{
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  }>,
) {
  return apiRequest(`/api/v1/admin/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateAdminProductStatus(input: {
  productId: string;
  status: ProductStatus;
  reason?: string;
}) {
  return apiRequest(`/api/v1/admin/products/${input.productId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: input.status,
      reason: input.reason,
    }),
  });
}

export async function createAdminProduct(input: unknown): Promise<AdminProduct> {
  return apiRequest("/api/v1/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminProduct(
  productId: string,
  input: unknown,
): Promise<AdminProduct> {
  return apiRequest(`/api/v1/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateAdminHomepageHeroProducts(input: {
  items: Array<{
    productId: string;
    sortOrder: number;
    isActive?: boolean;
  }>;
}): Promise<AdminHomepageHeroProduct[]> {
  const data = await apiRequest<{
    heroProducts: AdminHomepageHeroProduct[];
  }>("/api/v1/admin/homepage/hero-products", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return data.heroProducts;
}

export async function updateAdminOrderStatus(input: {
  orderNumber: string;
  status: string;
  reason?: string;
  adminNote?: string;
}) {
  return apiRequest(`/api/v1/admin/orders/${input.orderNumber}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: input.status,
      reason: input.reason,
      adminNote: input.adminNote,
    }),
  });
}

export async function updateAdminOrderPaymentStatus(input: {
  orderNumber: string;
  paymentStatus: string;
  reason?: string;
}) {
  return apiRequest(`/api/v1/admin/orders/${input.orderNumber}/payment-status`, {
    method: "PATCH",
    body: JSON.stringify({
      paymentStatus: input.paymentStatus,
      reason: input.reason,
    }),
  });
}

export async function updateAdminOrderNote(input: {
  orderNumber: string;
  adminNote: string | null;
}) {
  return apiRequest(`/api/v1/admin/orders/${input.orderNumber}/notes`, {
    method: "PATCH",
    body: JSON.stringify({
      adminNote: input.adminNote,
    }),
  });
}

export async function listAdminDeliveryZones(): Promise<AdminDeliveryZone[]> {
  const data = await apiRequest<{ zones: AdminDeliveryZone[] }>(
    "/api/v1/admin/delivery/zones",
  );

  return data.zones;
}

export async function createAdminDeliveryZone(input: {
  name: string;
  baseFee: number;
  isActive?: boolean;
}): Promise<AdminDeliveryZone> {
  return apiRequest("/api/v1/admin/delivery/zones", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminDeliveryZone(
  id: string,
  input: Partial<{
    name: string;
    baseFee: number;
    isActive: boolean;
    sortOrder: number;
  }>,
): Promise<AdminDeliveryZone> {
  return apiRequest(`/api/v1/admin/delivery/zones/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function listAdminSurchargeRules(): Promise<
  AdminSurchargeRule[]
> {
  const data = await apiRequest<{ surchargeRules: AdminSurchargeRule[] }>(
    "/api/v1/admin/delivery/surcharge-rules",
  );

  return data.surchargeRules;
}

export async function createAdminSurchargeRule(input: {
  name: string;
  startsAtTime: string;
  endsAtTime?: string | null;
  amount: number;
  isActive?: boolean;
}): Promise<AdminSurchargeRule> {
  return apiRequest("/api/v1/admin/delivery/surcharge-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminSurchargeRule(
  id: string,
  input: Partial<{
    name: string;
    startsAtTime: string;
    endsAtTime: string | null;
    amount: number;
    isActive: boolean;
  }>,
): Promise<AdminSurchargeRule> {
  return apiRequest(`/api/v1/admin/delivery/surcharge-rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const data = await apiRequest<{ paymentSettings: PaymentSettings | null }>(
    "/api/v1/admin/settings/payment",
  );

  return data.paymentSettings;
}

export async function updatePaymentSettings(input: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentInstruction: string;
  proofWhatsappNumber: string;
  isActive: boolean;
}): Promise<PaymentSettings> {
  return apiRequest("/api/v1/admin/settings/payment", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const data = await apiRequest<{ templates: EmailTemplate[] }>(
    "/api/v1/admin/email/templates",
  );

  return data.templates;
}

export async function moderateAdminReview(input: {
  id: string;
  status: Exclude<ReviewStatus, "PENDING">;
  reason?: string;
}) {
  return apiRequest(`/api/v1/admin/reviews/${input.id}/moderation`, {
    method: "PATCH",
    body: JSON.stringify({
      status: input.status,
      reason: input.reason,
    }),
  });
}

export interface PresignMediaUploadResponse {
  mediaAsset: {
    id: string;
    publicUrl: string | null;
  };
  upload: {
    method: "PUT";
    url: string;
    headers: {
      "content-type": string;
    };
  };
}

export async function presignProductImageUpload(input: {
  fileName: string;
  contentType: string;
  byteSize: number;
}): Promise<PresignMediaUploadResponse> {
  return apiRequest("/api/v1/admin/media/presign-upload", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      purpose: "PRODUCT_IMAGE",
    }),
  });
}

export async function completeMediaUpload(mediaAssetId: string) {
  return apiRequest(`/api/v1/admin/media/${mediaAssetId}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function attachProductImage(input: {
  productId: string;
  mediaAssetId: string;
  altText?: string | null;
  isPrimary?: boolean;
}) {
  return apiRequest(`/api/v1/admin/products/${input.productId}/images`, {
    method: "POST",
    body: JSON.stringify({
      mediaAssetId: input.mediaAssetId,
      altText: input.altText ?? null,
      isPrimary: input.isPrimary ?? true,
    }),
  });
}
