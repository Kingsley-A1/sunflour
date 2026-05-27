# API Contracts - Sunflour Bakery

Status: placeholder for Phase 0. Complete this document before implementing backend API routes.

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

## Contract Checklist

- [ ] Every request body/query/param is validated with Zod.
- [ ] Every route documents auth requirement: public, customer, moderator, or super_admin.
- [ ] Every route documents success response shape.
- [ ] Every route documents expected error codes.
- [ ] Every route documents side effects.
- [ ] Every admin-critical mutation documents audit log behavior.
- [ ] Every order status mutation documents `order_status_events` behavior.
- [x] Checkout uses idempotency.
- [ ] Frontend never submits trusted prices, fees, surcharge, or totals.
- [ ] Public APIs expose only data needed for the user journey.

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
- [ ] Guest order lookup token strategy.

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

Rules:

- New reviews enter `PENDING`.
- Public listing must only show approved reviews.
- Apply rate limiting.

Decisions needed:

- [ ] Whether reviews must be order-linked in v1.
- [ ] Minimum and maximum comment length.

## Planned Customer API Contracts

- [ ] `GET /api/v1/customer/profile`
- [ ] `PATCH /api/v1/customer/profile`
- [ ] `GET /api/v1/customer/orders`
- [ ] `GET /api/v1/customer/orders/[orderNumber]`
- [x] `GET /api/v1/customer/orders/[orderNumber]/invoice`

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
- [ ] Dashboard metrics endpoint.
- [ ] Order list/detail/update endpoints.
- [x] `GET /api/v1/admin/orders/[orderNumber]/invoice`
- [x] Payment confirmation/rejection endpoint.
- [x] Delivery zone and surcharge rule endpoints.
- [x] Payment settings endpoint.
- [ ] Email template/outbox endpoints.
- [ ] Review moderation endpoints.
- [ ] Audit log endpoint.

Admin contracts must document required role and audit behavior.

### Category Admin

```txt
GET    /api/v1/admin/categories          MODERATOR | SUPER_ADMIN
POST   /api/v1/admin/categories          SUPER_ADMIN
PATCH  /api/v1/admin/categories/[id]     SUPER_ADMIN
DELETE /api/v1/admin/categories/[id]     SUPER_ADMIN, soft-archives with is_active=false
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
- Product base price updates write PRODUCT_PRICE_UPDATE audit logs.
- Product variant price updates write PRODUCT_VARIANT_PRICE_UPDATE audit logs.
- Product status updates write PRODUCT_STATUS_UPDATE audit logs.
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
- Completion marks media_assets status READY.
- Product image creation attaches READY media assets only.
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
GET /api/v1/admin/orders/[orderNumber]/invoice        MODERATOR | SUPER_ADMIN
```

Rules:

```txt
- Customers can access only invoices for their own authenticated orders.
- Admins can access order invoices for operations.
- Invoice HTML remains stable because it is stored as html_snapshot.
- Invoice works without email and can later be attached to email.
```

## Auth Routes

### `GET|POST /api/auth/[...nextauth]`

Purpose: Auth.js/NextAuth Google OAuth session handling.

Rules:

```txt
- Google OAuth is the v1 login provider.
- Sessions are database-backed through Prisma.
- Allowlisted admin emails are promoted to MODERATOR or SUPER_ADMIN on sign-in.
- Admin API access still requires active admin_profiles server-side.
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

- [ ] Official Sunflour address.
- [ ] Moniepoint bank details.
- [ ] WhatsApp proof number.
- [ ] Admin emails and role assignments.
- [ ] Delivery zones and base fees.
- [ ] Surcharge rule enablement and close-of-day behavior.
- [ ] Pickup operating rules.
- [ ] Order operating hours.
- [ ] Email sender domain and sender name.
