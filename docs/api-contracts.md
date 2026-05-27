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
- [ ] Checkout uses idempotency.
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

Decisions needed:

- [ ] Whether inactive zones are omitted or shown as unavailable.

### `POST /api/v1/public/delivery/quote`

Purpose: Calculate delivery base fee, 6 PM surcharge, and total fee server-side.

Rules:

- Pickup returns NGN 0.
- Delivery uses selected active zone.
- Active surcharge applies from 6:00 PM.

Decisions needed:

- [ ] Production timezone source.
- [ ] Operating hours behavior after close.

### `POST /api/v1/public/checkout`

Purpose: Create guest or authenticated order after server-side recalculation.

Rules:

- Ignore client-submitted prices and totals.
- Recalculate subtotal, delivery base fee, surcharge, and total.
- Snapshot product, delivery, and payment instructions.
- Initial order status is `PENDING_PAYMENT`.
- Initial payment status is `UNPAID`.
- Return invoice link and WhatsApp proof handoff link.

Decisions needed:

- [ ] Required customer fields.
- [ ] Phone number format standard.
- [ ] Idempotency key header name.
- [ ] Guest order lookup token strategy.

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
- [ ] `GET /api/v1/customer/orders/[orderNumber]/invoice`

Decision needed: confirm whether customer auth is Google-only in v1 or also credentials/email reset.

## Planned Admin API Contracts

- [x] `GET /api/v1/admin/health`
- [x] `GET /api/v1/admin/super-admin/health`
- [x] `PATCH /api/v1/admin/settings/payment` Phase 2 guard only; full payment settings mutation belongs to Phase 6.
- [x] Category CRUD endpoints.
- [x] Product CRUD endpoints.
- [x] Product variant CRUD endpoints.
- [x] Product image create endpoint.
- [x] Product status update endpoint.
- [x] R2 signed upload endpoint.
- [ ] Dashboard metrics endpoint.
- [ ] Order list/detail/update endpoints.
- [ ] Payment confirmation/rejection endpoints.
- [ ] Delivery zone and surcharge rule endpoints.
- [ ] Payment settings endpoint.
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

### `PATCH /api/v1/admin/settings/payment`

Purpose: Phase 2 authorization guard for future payment settings mutations.

Auth: `SUPER_ADMIN` with active `admin_profiles` row.

Request body:

```ts
{
  reason?: string;
}
```

Success:

```ts
{
  ok: true;
  data: {
    status: "authorized";
    role: "SUPER_ADMIN";
    message: string;
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
Writes audit_logs action PAYMENT_SETTINGS_ACCESS_VERIFIED.
```

Full Moniepoint/payment setting update fields must be defined in Phase 6 before this route performs real setting mutations.

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
