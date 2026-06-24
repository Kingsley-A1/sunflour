# API Contracts - Sunflour Bakery

Status: active Backend 2.0 API contract. This document reflects the implemented `src/app/api/v1` route inventory as of 2026-05-28 and records launch-blocking owner decisions separately from completed backend behavior.

## Source Of Truth

Read these files before editing API contracts:

```txt
AGENTS.md
backend-implementation.md
frontend-implimentation.md
docs/database-schema.md
docs/order-lifecycle.md
```

## Contract Shape

All API responses must use the shared envelope:

```ts
export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};
```

Do not expose secrets, stack traces, raw Prisma errors, or unsafe database details.

## Route Namespaces

```txt
/api/v1/public/*
/api/v1/customer/*
/api/v1/admin/*
/api/v1/webhooks/*
```

Route handlers must stay thin:

```txt
Route handler -> validate request -> call service/module -> return typed response
```

## Implemented Route Inventory

```txt
GET    /api/v1/public/health
GET    /api/v1/public/menu
GET    /api/v1/public/products/[slug]
GET    /api/v1/public/delivery/zones
POST   /api/v1/public/delivery/quote
POST   /api/v1/public/checkout
GET    /api/v1/public/invoices/[orderNumber]?token=...
POST   /api/v1/public/orders/lookup
GET    /api/v1/public/reviews
POST   /api/v1/public/reviews
POST   /api/v1/public/auth/register
POST   /api/v1/public/auth/admin-register
POST   /api/v1/public/auth/password-reset/request
POST   /api/v1/public/auth/password-reset/confirm

GET    /api/v1/customer/profile
PATCH  /api/v1/customer/profile
GET    /api/v1/customer/orders
GET    /api/v1/customer/orders/[orderNumber]
GET    /api/v1/customer/orders/[orderNumber]/invoice

GET    /api/v1/admin/health
GET    /api/v1/admin/super-admin/health
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/audit-logs
GET    /api/v1/admin/admin-registration-codes
POST   /api/v1/admin/admin-registration-codes
GET    /api/v1/admin/categories
POST   /api/v1/admin/categories
PATCH  /api/v1/admin/categories/[id]
DELETE /api/v1/admin/categories/[id]
GET    /api/v1/admin/tabular-menu
PATCH  /api/v1/admin/tabular-menu
GET    /api/v1/admin/homepage/hero-products
PATCH  /api/v1/admin/homepage/hero-products
GET    /api/v1/admin/products
POST   /api/v1/admin/products
GET    /api/v1/admin/products/[id]
PATCH  /api/v1/admin/products/[id]
DELETE /api/v1/admin/products/[id]
PATCH  /api/v1/admin/products/[id]/status
POST   /api/v1/admin/products/[id]/variants
PATCH  /api/v1/admin/variants/[id]
DELETE /api/v1/admin/variants/[id]
POST   /api/v1/admin/products/[id]/images
POST   /api/v1/admin/media/presign-upload
POST   /api/v1/admin/media/[id]/complete
GET    /api/v1/admin/delivery/zones
POST   /api/v1/admin/delivery/zones
PATCH  /api/v1/admin/delivery/zones/[id]
DELETE /api/v1/admin/delivery/zones/[id]
GET    /api/v1/admin/delivery/surcharge-rules
POST   /api/v1/admin/delivery/surcharge-rules
PATCH  /api/v1/admin/delivery/surcharge-rules/[id]
DELETE /api/v1/admin/delivery/surcharge-rules/[id]
GET    /api/v1/admin/settings/payment
PATCH  /api/v1/admin/settings/payment
GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/[orderNumber]
PATCH  /api/v1/admin/orders/[orderNumber]/status
PATCH  /api/v1/admin/orders/[orderNumber]/notes
PATCH  /api/v1/admin/orders/[orderNumber]/payment-status
GET    /api/v1/admin/orders/[orderNumber]/invoice
GET    /api/v1/admin/reviews
PATCH  /api/v1/admin/reviews/[id]/moderation
GET    /api/v1/admin/email/templates
PATCH  /api/v1/admin/email/templates/[key]
GET    /api/v1/admin/email/outbox
POST   /api/v1/admin/email/outbox/process
POST   /api/v1/admin/email/outbox/[id]/retry
POST   /api/v1/admin/email/manual

POST   /api/v1/webhooks/cron/email-outbox
```

## Contract Checklist

- [x] Every request body/query/param is validated with Zod for implemented routes.
- [x] Every implemented route documents or enforces auth requirement: public, customer, moderator, or super_admin.
- [x] Every implemented route is listed by namespace and role.
- [x] Critical route families document success response shape.
- [x] Critical route families document expected error codes.
- [x] Critical route families document side effects.
- [x] Every admin-critical mutation documents audit log behavior.
- [x] Every order status mutation documents `order_status_events` behavior.
- [x] Checkout uses idempotency.
- [x] Frontend never submits trusted prices, fees, surcharge, or totals.
- [x] Public APIs expose only data needed for the user journey.

Malformed JSON returns:

```txt
400 VALIDATION_ERROR
```

Prisma not-found errors are normalized to:

```txt
404 NOT_FOUND
```

## Planned Public API Contracts

### `GET /api/v1/public/menu`

Purpose: Return active categories and orderable public products.

Status: implemented in Phase 3.

Rules:

```txt
- HIDDEN products are never returned publicly.
- ACTIVE products are public and orderable.
- OUT_OF_STOCK products are public only when show_when_out_of_stock is true.
- OUT_OF_STOCK products are never orderable.
- Only active variants are returned publicly.
- Only READY media assets are returned as public product images.
```

Success:

```ts
{
  ok: true;
  data: {
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      products: PublicProduct[];
    }>;
  };
}
```

### `GET /api/v1/public/products/[slug]`

Purpose: Return public product detail, variants, images, status, and orderability.

Status: implemented in Phase 3.

Rules:

```txt
- Slugs are unique.
- Hidden products return 404 publicly.
- Public product detail uses the same visibility rules as /menu.
```

### `GET /api/v1/public/delivery/zones`

Purpose: Return active delivery zones available for checkout.

Status: implemented in Phase 4.

Rules:

```txt
- Only active delivery zones are returned publicly.
- Delivery fees are returned as integer minor units in NGN.
- Inactive zones are omitted publicly and rejected by quote/checkout.
```

Success:

```ts
{
  ok: true;
  data: {
    zones: Array<{
      id: string;
      name: string;
      slug: string;
      baseFee: number;
    }>;
  };
}
```

### `POST /api/v1/public/delivery/quote`

Purpose: Calculate delivery base fee, 6 PM surcharge, and total fee server-side.

Status: implemented in Phase 4.

Rules:

- Pickup returns NGN 0.
- Delivery uses selected active zone.
- Active surcharge applies from 6:00 PM Africa/Lagos time.
- The default 6 PM surcharge is NGN 500 stored as `50000` minor units.
- The request body is strict; client-submitted delivery totals, fees, or surcharge values are rejected.

Request:

```ts
{
  deliveryMethod: "DELIVERY" | "PICKUP";
  deliveryZoneId?: string;
}
```

Success:

```ts
{
  ok: true;
  data: {
    deliveryMethod: "DELIVERY" | "PICKUP";
    deliveryZone: {
      id: string;
      name: string;
      slug: string;
    } | null;
    baseFee: number;
    surcharge: number;
    totalFee: number;
    appliedSurchargeRules: Array<{
      id: string;
      name: string;
      amount: number;
      startsAtTime: string;
      endsAtTime: string | null;
    }>;
    quotedAt: string;
  };
}
```

Errors:

```txt
400 VALIDATION_ERROR
400 DELIVERY_ZONE_UNAVAILABLE
```

### `POST /api/v1/public/checkout`

Purpose: Create guest or authenticated order after server-side recalculation.

Status: implemented in Phase 5.

Rules:

- Ignore client-submitted prices and totals.
- Recalculate subtotal, delivery base fee, surcharge, and total.
- Snapshot product, delivery, and payment instructions.
- Initial order status is `PENDING_PAYMENT`.
- Initial payment status is `UNPAID`.
- Return invoice link and WhatsApp proof handoff link.
- Require `Idempotency-Key` header to protect duplicate submissions.
- Hidden and out-of-stock products cannot be ordered.
- Pickup creates NGN 0 delivery fee snapshots.
- Delivery requires delivery zone and delivery address.

Headers:

```txt
Idempotency-Key: required string, 8-160 characters
```

Request:

```ts
{
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  delivery: {
    method: "DELIVERY" | "PICKUP";
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
```

Success:

```ts
{
  ok: true;
  data: {
    orderNumber: string;
    customerType: "GUEST" | "AUTHENTICATED";
    status: "PENDING_PAYMENT";
    paymentStatus: "UNPAID";
    paymentMethod: "BANK_TRANSFER";
    subtotal: number;
    total: number;
    delivery: {
      method: "DELIVERY" | "PICKUP";
      address: string | null;
      zoneId: string | null;
      zoneName: string | null;
      baseFee: number;
      surcharge: number;
      totalFee: number;
    };
    items: Array<{
      productName: string;
      variantName: string | null;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }>;
    invoiceNumber: string | null;
    paymentInstruction: string;
    invoiceUrl: string;
    whatsAppProofUrl: string;
    whatsAppProofMessage: string;
  };
}
```

Errors:

```txt
400 VALIDATION_ERROR
400 CHECKOUT_ITEM_UNAVAILABLE
400 DELIVERY_ZONE_UNAVAILABLE
409 IDEMPOTENCY_CONFLICT
```

Decisions needed:

- [x] Required customer fields: full name and phone. Email is optional.
- [x] Phone number format: normalized to digits with optional leading `+`.
- [x] Idempotency key header name: `Idempotency-Key`.
- [x] Guest order lookup uses order number + normalized phone match in v1. Tokenized invoice access remains separate.

Phase 6 update:

```txt
Payment instructions now come from active admin-managed payment_settings.
Checkout fails with PAYMENT_SETTINGS_UNAVAILABLE when active payment settings do not exist.
```

Phase 7 update:

```txt
Checkout creates an invoice record and returns a tokenized public invoice API URL.
```

### `GET /api/v1/public/invoices/[orderNumber]?token=...`

Purpose: Return a stable purchase invoice by order number and public access token.

Status: implemented in Phase 7.

Auth: public with token.

Rules:

```txt
- Missing or invalid token returns NOT_FOUND.
- Invoice HTML is a stored snapshot and does not recalculate order prices.
- Public response does not expose the public access token.
```

Success:

```ts
{
  ok: true;
  data: {
    id: string;
    invoiceNumber: string;
    htmlSnapshot: string;
    pdfUrl: string | null;
    generatedAt: string;
    createdAt: string;
    order: {
      orderNumber: string;
      customerNameSnapshot: string;
      customerPhoneSnapshot: string;
      customerEmailSnapshot: string | null;
      subtotal: number;
      total: number;
      status: string;
      paymentStatus: string;
    };
  };
}
```

Errors:

```txt
400 VALIDATION_ERROR
404 NOT_FOUND
```

### `POST /api/v1/public/reviews`

Purpose: Accept public review submissions.

Status: implemented in Phase 11.

Rules:

- New reviews enter `PENDING`.
- Public listing must only show approved reviews.
- Apply rate limiting.

Request:

```ts
{
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  productId?: string;
}
```

Success:

```ts
{
  ok: true;
  data: {
    review: {
      id: string;
      status: "PENDING";
      createdAt: string;
    };
  };
}
```

### `GET /api/v1/public/reviews`

Purpose: Return only approved public reviews.

Status: implemented in Phase 11.

Query:

```txt
productId optional
limit optional, max 50
```

Rules:

```txt
- Only APPROVED reviews are returned.
- Customer phone, email, admin moderation notes, and audit details are never returned publicly.
```

Decisions still deferred:

- [ ] Whether reviews must be order-linked in v1. Current v1 supports non-order-linked moderated public reviews.

## Planned Customer API Contracts

- [x] `GET /api/v1/customer/profile`
- [x] `PATCH /api/v1/customer/profile`
- [x] `GET /api/v1/customer/orders`
- [x] `GET /api/v1/customer/orders/[orderNumber]`
- [x] `GET /api/v1/customer/orders/[orderNumber]/invoice`
- [x] `POST /api/v1/public/orders/lookup`

Decision needed: confirm whether customer auth is Google-only in v1 or also credentials/email reset.

## Planned Admin API Contracts

- [x] `GET /api/v1/admin/health`
- [x] `GET /api/v1/admin/super-admin/health`
- [x] `GET /api/v1/admin/settings/payment`
- [x] `PATCH /api/v1/admin/settings/payment`
- [x] Category CRUD endpoints.
- [x] Product CRUD endpoints.
- [x] Product variant CRUD endpoints.
- [x] Product image create endpoint.
- [x] Product status update endpoint.
- [x] R2 signed upload endpoint.
- [x] Dashboard metrics endpoint.
- [x] Order list/detail/update endpoints.
- [x] `GET /api/v1/admin/orders/[orderNumber]/invoice`
- [x] Payment confirmation/rejection endpoint.
- [x] Delivery zone and surcharge rule endpoints.
- [x] Payment settings endpoint.
- [x] Email template/outbox endpoints.
- [x] Review moderation endpoints.
- [x] Audit log endpoint.

Admin contracts must document required role and audit behavior.

### Category Admin

```txt
GET    /api/v1/admin/categories          MODERATOR | SUPER_ADMIN
POST   /api/v1/admin/categories          SUPER_ADMIN
PATCH  /api/v1/admin/categories/[id]     SUPER_ADMIN
DELETE /api/v1/admin/categories/[id]     SUPER_ADMIN, soft-archives with is_active=false
```

### Tabular Menu Admin

```txt
GET   /api/v1/admin/tabular-menu         MEDIA_MANAGER | SUPER_ADMIN
PATCH /api/v1/admin/tabular-menu         MEDIA_MANAGER | SUPER_ADMIN
```

Rules:

```txt
- This surface manages only the public reference menu shown in `/menu?view=table`.
- Stored content lives in `site_settings` under the `tabular_menu_content` key.
- The tabular menu must not become a trusted pricing source for checkout, invoices, or order totals.
- Invalid or missing stored JSON falls back to the documented default content for public reads.
- PATCH writes TABULAR_MENU_UPDATE audit logs.
```

### Product Admin

```txt
GET    /api/v1/admin/products                      MODERATOR | SUPER_ADMIN
POST   /api/v1/admin/products                      SUPER_ADMIN
GET    /api/v1/admin/products/[id]                 MODERATOR | SUPER_ADMIN
PATCH  /api/v1/admin/products/[id]                 SUPER_ADMIN
DELETE /api/v1/admin/products/[id]                 SUPER_ADMIN, soft-archives with status=HIDDEN
PATCH  /api/v1/admin/products/[id]/status          MODERATOR | SUPER_ADMIN
POST   /api/v1/admin/products/[id]/variants        SUPER_ADMIN
PATCH  /api/v1/admin/variants/[id]                 SUPER_ADMIN
DELETE /api/v1/admin/variants/[id]                 SUPER_ADMIN, soft-archives with is_active=false
POST   /api/v1/admin/products/[id]/images          SUPER_ADMIN
```

Rules:

```txt
- Moderators can only update product availability between ACTIVE and OUT_OF_STOCK.
- Moderators cannot hide products or unhide hidden products.
- Product creation requires 1-8 completed PRODUCT_IMAGE media assets in `images[]`.
- Product image alt text should be generated from the product name, not from the uploaded file name.
- The first product image is the card/list primary image unless another image is explicitly made primary later.
- Product base price updates write PRODUCT_PRICE_UPDATE audit logs.
- Product variant price updates write PRODUCT_VARIANT_PRICE_UPDATE audit logs.
- Product status updates write PRODUCT_STATUS_UPDATE audit logs.
- Category create/update/archive writes CATEGORY_CREATE, CATEGORY_UPDATE, and CATEGORY_ARCHIVE audit logs.
- Product create/update/archive writes PRODUCT_CREATE, PRODUCT_UPDATE, and PRODUCT_ARCHIVE audit logs.
- Product variant create/archive writes PRODUCT_VARIANT_CREATE and PRODUCT_VARIANT_ARCHIVE audit logs.
```

### Homepage Merchandising Admin

```txt
GET   /api/v1/admin/homepage/hero-products       MODERATOR | SUPER_ADMIN
PATCH /api/v1/admin/homepage/hero-products       SUPER_ADMIN
```

Rules:

```txt
- Hero products are explicit ordered placements for the public homepage.
- Only ACTIVE products from active categories can be saved as hero products.
- Public homepage fallback selection is backend-owned and deterministic.
- Missing product-click tracking must not be faked as most-clicked data.
- PATCH writes HOMEPAGE_HERO_PRODUCTS_UPDATE audit logs.
```

### Media Admin

```txt
POST /api/v1/admin/media/presign-upload       SUPER_ADMIN
POST /api/v1/admin/media/[id]/complete        SUPER_ADMIN
```

Upload validation:

```txt
Allowed types: image/jpeg, image/png, image/webp, image/avif
Max product image size: 5 MB
Purpose: PRODUCT_IMAGE
```

Side effects:

```txt
- Presign creates media_assets status PENDING_UPLOAD.
- Completion verifies the object exists in R2 and that content type and byte size match before marking media_assets status READY.
- Completion does not accept a client-supplied public URL; the backend derives the public URL from configured R2 public base URL.
- Failed completion keeps media_assets status PENDING_UPLOAD and writes MEDIA_UPLOAD_VERIFICATION_FAILED.
- Product image creation attaches READY media assets only; new products require at least one image at create time.
- Media upload URL creation and completion write audit logs.
```

### Delivery Admin

```txt
GET    /api/v1/admin/delivery/zones                  SUPER_ADMIN
POST   /api/v1/admin/delivery/zones                  SUPER_ADMIN
PATCH  /api/v1/admin/delivery/zones/[id]             SUPER_ADMIN
DELETE /api/v1/admin/delivery/zones/[id]             SUPER_ADMIN, soft-archives with is_active=false

GET    /api/v1/admin/delivery/surcharge-rules        SUPER_ADMIN
POST   /api/v1/admin/delivery/surcharge-rules        SUPER_ADMIN
PATCH  /api/v1/admin/delivery/surcharge-rules/[id]   SUPER_ADMIN
DELETE /api/v1/admin/delivery/surcharge-rules/[id]   SUPER_ADMIN, soft-archives with is_active=false
```

Rules:

```txt
- Delivery zones and surcharge rules are admin-editable without code changes.
- Delivery fee and surcharge amounts are integer minor units in NGN.
- Delivery fee changes write DELIVERY_FEE_UPDATE audit logs.
- Surcharge rule changes write SURCHARGE_RULE_UPDATE audit logs.
```

### `GET /api/v1/admin/health`

Purpose: Verify that the admin API is reachable only by active admin users.

Auth: `MODERATOR` or `SUPER_ADMIN` with active `admin_profiles` row.

Success:

```ts
{
  ok: true;
  data: {
    service: "sunflour-admin-api";
    status: "ok";
    role: "MODERATOR" | "SUPER_ADMIN";
    timestamp: string;
  };
}
```

Errors:

```txt
401 UNAUTHORIZED
403 FORBIDDEN
```

Side effects: none.

### `GET /api/v1/admin/super-admin/health`

Purpose: Verify that super-admin-only route protection works.

Auth: `SUPER_ADMIN` with active `admin_profiles` row.

Errors:

```txt
401 UNAUTHORIZED
403 FORBIDDEN
```

Side effects: none.

### Payment Settings Admin

```txt
GET   /api/v1/admin/settings/payment       SUPER_ADMIN
PATCH /api/v1/admin/settings/payment       SUPER_ADMIN
```

Purpose: Manage active Moniepoint/manual transfer details used by checkout.

PATCH request:

```ts
{
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentInstruction: string;
  proofWhatsappNumber: string;
  isActive?: boolean;
}
```

Success:

```ts
{
  ok: true;
  data: {
    id: string;
    settingKey: "default";
    bankName: string;
    accountName: string;
    accountNumber: string;
    paymentInstruction: string;
    proofWhatsappNumber: string;
    isActive: boolean;
    updatedByUserId: string | null;
    createdAt: string;
    updatedAt: string;
  };
}
```

Errors:

```txt
400 VALIDATION_ERROR
401 UNAUTHORIZED
403 FORBIDDEN
```

Side effects:

```txt
PATCH writes audit_logs action PAYMENT_SETTINGS_UPDATE.
```

Rules:

```txt
- Moderators cannot view or update payment account settings.
- Checkout snapshots the active payment settings onto the order.
- Old orders do not change when payment settings are updated later.
```

### Payment Status Admin

```txt
PATCH /api/v1/admin/orders/[orderNumber]/payment-status     MODERATOR | SUPER_ADMIN
```

### Order Lifecycle Admin

```txt
GET   /api/v1/admin/orders                         MODERATOR | SUPER_ADMIN
GET   /api/v1/admin/orders/[orderNumber]           MODERATOR | SUPER_ADMIN
PATCH /api/v1/admin/orders/[orderNumber]/status    MODERATOR | SUPER_ADMIN
PATCH /api/v1/admin/orders/[orderNumber]/notes     MODERATOR | SUPER_ADMIN
```

Rules:

```txt
- Status transitions are validated server-side.
- Pickup orders can move PREPARING -> READY_FOR_PICKUP -> DELIVERED.
- Delivery orders can move PREPARING -> OUT_FOR_DELIVERY -> DELIVERED.
- Pickup orders cannot move to OUT_FOR_DELIVERY.
- Delivery orders cannot move to READY_FOR_PICKUP.
- CANCELLED, REJECTED, and DELIVERED are terminal unless a future super_admin override policy is explicitly approved.
- Cancellation and rejection require a reason.
- Every status change creates an order_status_events row.
- Every admin mutation writes audit_logs.
```

### Customer Profile And Guest Lookup

```txt
GET   /api/v1/customer/profile                   authenticated customer
PATCH /api/v1/customer/profile                   authenticated customer
GET   /api/v1/customer/orders                    authenticated customer owner
GET   /api/v1/customer/orders/[orderNumber]      authenticated customer owner
POST  /api/v1/public/orders/lookup               public, order number + phone
```

Rules:

```txt
- Customer order routes return only the authenticated user's own orders.
- Guest lookup requires both order number and normalized phone match.
- Guest lookup returns the same NOT_FOUND response for missing order and phone mismatch.
- Guest lookup does not expose admin notes, audit logs, internal IDs, or admin-only history.
```

### Review Moderation Admin

```txt
GET   /api/v1/admin/reviews                         MODERATOR | SUPER_ADMIN
PATCH /api/v1/admin/reviews/[id]/moderation         MODERATOR | SUPER_ADMIN
```

Rules:

```txt
- Public submissions cannot choose review status.
- Moderation supports APPROVED, REJECTED, and HIDDEN.
- REJECTED and HIDDEN require a reason.
- Every moderation action writes audit_logs.
```

### Dashboard Metrics Admin

```txt
GET /api/v1/admin/dashboard       MODERATOR | SUPER_ADMIN
```

Rules:

```txt
- Response contains one operational dashboard payload.
- Date range defaults to today in APP_TIME_ZONE.
- `rangeMetrics` contains selected-period counts, sales estimate, and top ordered items.
- `currentBacklog` contains current operational queues such as pending payment, preparing, out for delivery, pending reviews, and unavailable products.
- Legacy `counts`, `salesEstimate`, `topOrderedItems`, `unavailableProducts`, and `recentPendingReviews` remain for current frontend compatibility.
- Sales estimate sums CONFIRMED payments and excludes CANCELLED and REJECTED orders.
- Sensitive payment settings, email template bodies, secrets, audit metadata, and customer PII are excluded.
```

Success includes:

```ts
{
  ok: true;
  data: {
    range: { from: Date; to: Date; timeZone: string };
    rangeMetrics: {
      ordersInRange: number;
      guestOrdersInRange: number;
      cancelledOrders: number;
      deliveredOrders: number;
      salesEstimate: { label: string; currency: "NGN"; total: number; semantics: "range" };
      topOrderedItems: Array<{ productName: string; variantName: string | null; quantity: number; salesTotal: number }>;
    };
    currentBacklog: {
      pendingPaymentConfirmation: number;
      preparingOrders: number;
      totalUsers: number;
      outForDeliveryOrders: number;
      pendingReviews: number;
      unavailableProducts: unknown[];
      recentPendingReviews: unknown[];
    };
  };
}
```

Purpose: Manually verify or reject payment after WhatsApp proof review.

Request:

```ts
{
  paymentStatus:
    | "PROOF_SENT_ON_WHATSAPP"
    | "UNDER_REVIEW"
    | "CONFIRMED"
    | "REJECTED";
  reason?: string;
}
```

Rules:

```txt
- Payment confirmation remains manual; the frontend cannot mark payment confirmed.
- Rejected payment requires a reason.
- Valid transitions are enforced server-side.
- Confirmation moves order status to PAYMENT_CONFIRMED.
- Rejection moves order status to REJECTED.
- Payment review states move order status to PAYMENT_UNDER_REVIEW.
```

Success:

```ts
{
  ok: true;
  data: {
    order: {
      orderNumber: string;
      status: string;
      paymentStatus: string;
    };
    event: {
      id: string;
      fromStatus: string;
      toStatus: string;
      reason: string | null;
      createdAt: string;
    };
  };
}
```

Errors:

```txt
400 VALIDATION_ERROR
400 INVALID_PAYMENT_STATUS_TRANSITION
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
```

Side effects:

```txt
- Creates payment_confirmation_events row.
- Creates order_status_events row when order status changes.
- Writes ORDER_PAYMENT_CONFIRMED audit log for confirmation.
- Writes ORDER_PAYMENT_REJECTED audit log for rejection.
- Writes ORDER_PAYMENT_STATUS_UPDATE audit log for review/proof states.
```

### Invoice Admin And Customer Access

```txt
GET /api/v1/customer/orders/[orderNumber]/invoice     authenticated customer owner
GET /api/v1/admin/orders/[orderNumber]/invoice        ATTENDANT | MODERATOR | SUPER_ADMIN
```

Rules:

```txt
- Customers can access only invoices for their own authenticated orders.
- Admins can access order invoices for operations.
- Invoice HTML remains stable because it is stored as html_snapshot.
- Invoice works without email and can later be attached to email.
```

### Email Admin And Outbox

```txt
GET  /api/v1/admin/email/templates                  SUPER_ADMIN
PATCH /api/v1/admin/email/templates/[key]           SUPER_ADMIN
GET  /api/v1/admin/email/outbox                     SUPER_ADMIN
POST /api/v1/admin/email/outbox/process             SUPER_ADMIN
POST /api/v1/admin/email/outbox/[id]/retry          SUPER_ADMIN
POST /api/v1/admin/email/manual                     SUPER_ADMIN
POST /api/v1/webhooks/cron/email-outbox             EMAIL_CRON_SECRET
```

Rules:

```txt
- All emails are queued through EmailService.
- Admin manual email queues an approved transactional template only.
- Disabled templates create SKIPPED outbox records.
- Outbox rows are claimed as PROCESSING before sending to prevent duplicate sends from concurrent processors.
- `order_id + template_key + recipient_email` prevents duplicate recipient sends while allowing multiple admin alert recipients.
- Failed sends are logged and can be retried.
- Resend failures do not block checkout/order creation.
- Cron processing requires EMAIL_CRON_SECRET in Authorization Bearer or x-cron-secret.
```

### Audit Logs Admin

```txt
GET /api/v1/admin/audit-logs        SUPER_ADMIN
```

Query:

```txt
actorUserId optional
action optional
targetType optional
targetId optional
createdFrom optional ISO date
createdTo optional ISO date
page default 1
pageSize default 25, max 100
```

Rules:

```txt
- Moderators cannot view audit logs.
- Response metadata is sanitized for sensitive keys such as secrets, tokens, passwords, account numbers, payment instructions, and WhatsApp proof numbers.
- Audit logs are append-only from the application perspective.
```

## Auth Routes

### `GET|POST /api/auth/[...nextauth]`

Purpose: Auth.js/NextAuth session handling for Google OAuth and credentials login.

Rules:

```txt
- Google OAuth remains available when AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are configured.
- Email/password credentials are supported for customers and admin/staff accounts.
- Sessions use JWT strategy because NextAuth v4 Credentials Provider does not persist database sessions.
- JWT/session callbacks carry id, email, name, and role only.
- Admin API access still requires active admin_profiles server-side.
- ADMIN_ALLOWLIST_EMAILS provisioning is restricted to verified Google OAuth sign-ins only.
- Public credentials self-registration never grants admin role from allowlist alone.
```

### `POST /api/v1/public/auth/register`

Purpose: Create a customer email/password account.

Request:

```ts
{
  fullName: string;
  email: string;
  password: string;
}
```

Rules:

```txt
- Email is normalized to lowercase.
- User.name stores fullName for personalization.
- Password is hashed with bcrypt cost 12.
- Duplicate email returns 409 CONFLICT.
- Response never includes password hash or lockout metadata.
```

### `POST /api/v1/public/auth/admin-register`

Purpose: Create an admin/staff account after role-code validation.

Request:

```ts
{
  fullName: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "MODERATOR" | "ATTENDANT" | "MEDIA_MANAGER";
  registrationCode: string;
}
```

Rules:

```txt
- Code is 6 digits, generated from ADMIN_REGISTRATION_CODE_SECRET, role, and the current 7-day UTC window.
- ADMIN_REGISTRATION_CODE_SECRET is the long signing secret, not the 6-digit code. It must be at least 32 characters.
- Use pnpm auth:admin-codes to print the current role-specific 6-digit codes for the configured secret.
- Valid registration creates users and active admin_profiles in one transaction.
- Registration writes ADMIN_REGISTERED_WITH_CODE audit log.
- Endpoint is rate-limited per client IP.
- Residual risk: weekly 6-digit codes must be treated as sensitive operational secrets and rotated immediately if exposed.
```

### `GET /api/v1/admin/admin-registration-codes`

Purpose: Let super admins view the active role-scoped admin registration codes.

Auth: `SUPER_ADMIN`.

Response:

```ts
{
  registrationCodes: {
    version: number;
    window: number;
    expiresAt: string;
    generatedAt: string;
    rotatedAt: string | null;
    rotatedByUserId: string | null;
    codes: Array<{
      role: "SUPER_ADMIN" | "MODERATOR" | "ATTENDANT" | "MEDIA_MANAGER";
      label: string;
      code: string;
    }>;
  };
}
```

Rules:

```txt
- Endpoint is visible only to active super admins.
- Response never exposes ADMIN_REGISTRATION_CODE_SECRET or the database rotation nonce.
- Codes are generated from ADMIN_REGISTRATION_CODE_SECRET, role, current 7-day UTC window, and the current database rotation nonce.
```

### `POST /api/v1/admin/admin-registration-codes`

Purpose: Regenerate all role-scoped admin registration codes without changing deployment environment secrets.

Auth: `SUPER_ADMIN`.

Request:

```ts
{
  confirmation: "ROTATE_ADMIN_REGISTRATION_CODES";
}
```

Rules:

```txt
- Updates only the database rotation nonce/version in site_settings.
- Does not change ADMIN_REGISTRATION_CODE_SECRET.
- Does not require a redeploy.
- Immediately invalidates previous role codes.
- Writes ADMIN_REGISTRATION_CODES_ROTATED audit log without storing generated codes, nonce, or secret.
```

### `POST /api/v1/public/auth/password-reset/request`

Purpose: Queue a transactional password reset email without revealing account existence.

Request:

```ts
{
  email: string;
}
```

Rules:

```txt
- Always returns a generic success message.
- Existing password accounts receive AUTH_PASSWORD_RESET through the email outbox.
- Reset tokens are random, hashed with SHA-256, stored in verification_tokens, and expire after 1 hour.
```

### `POST /api/v1/public/auth/password-reset/confirm`

Purpose: Consume a valid reset token and set a new password.

Request:

```ts
{
  email: string;
  token: string;
  password: string;
}
```

Rules:

```txt
- Token is checked by hashed value and expiry.
- Successful reset updates password_hash, password_updated_at, clears lockout counters, and consumes all active reset tokens for that email.
- Invalid or expired token returns 400 VALIDATION_ERROR.
```

## Error Code Registry

Add canonical error codes here before implementation.

```txt
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
CHECKOUT_ITEM_UNAVAILABLE
CHECKOUT_PRICE_RECALCULATED
DELIVERY_ZONE_UNAVAILABLE
INVALID_ORDER_STATUS_TRANSITION
INVALID_PAYMENT_STATUS_TRANSITION
IDEMPOTENCY_CONFLICT
PAYMENT_SETTINGS_UNAVAILABLE
INTERNAL_ERROR
```

## Open Product Decisions

- [ ] Launch-blocking owner confirmation: official Sunflour address.
- [ ] Launch-blocking owner confirmation: Moniepoint bank details.
- [ ] Launch-blocking owner confirmation: WhatsApp proof number.
- [ ] Launch-blocking owner confirmation: admin emails and role assignments.
- [ ] Launch-blocking owner confirmation: delivery zones and base fees.
- [ ] Launch-blocking owner confirmation: surcharge rule enablement and close-of-day behavior.
- [ ] Launch-blocking owner confirmation: pickup operating rules.
- [ ] Launch-blocking owner confirmation: order operating hours.
- [ ] Launch-blocking owner confirmation: email sender domain and sender name.
- [ ] Launch-blocking owner confirmation: R2 bucket and public media URL strategy.

## Deferred Work

```txt
- Saved customer addresses.
- Order-linked review requirement.
- Super-admin break-glass override workflow.
- Durable distributed rate limiting.
- PDF invoice generation.
```
