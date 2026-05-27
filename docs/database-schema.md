# Database Schema - Sunflour Bakery

Status: active draft. Phase 1 foundation, Phase 2 auth/RBAC, Phase 3 catalog/media, Phase 4 delivery pricing, Phase 5 checkout/order, Phase 6 payment workflow, Phase 7 invoice tables, and Phase 8 email outbox tables are implemented.

## Source Of Truth

Read these files before editing database schema:

```txt
AGENTS.md
backend-implementation.md
frontend-implimentation.md
docs/api-contracts.md
docs/order-lifecycle.md
```

## Database Standard

```txt
Database: CockroachDB
ORM: Prisma
Money: store integer minor units for NGN values
Timestamps: store UTC timestamps
Application timezone: confirm before launch
```

Do not build schema that depends on frontend-submitted prices or totals.

## Required Enums

```txt
UserRole:
CUSTOMER
MODERATOR
SUPER_ADMIN

CustomerType:
GUEST
AUTHENTICATED

ProductStatus:
ACTIVE
HIDDEN
OUT_OF_STOCK

DeliveryMethod:
DELIVERY
PICKUP

OrderStatus:
PENDING_PAYMENT
PAYMENT_UNDER_REVIEW
PAYMENT_CONFIRMED
PREPARING
READY_FOR_PICKUP
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
REJECTED

PaymentStatus:
UNPAID
PROOF_SENT_ON_WHATSAPP
UNDER_REVIEW
CONFIRMED
REJECTED

PaymentMethod:
BANK_TRANSFER

ReviewStatus:
PENDING
APPROVED
REJECTED
HIDDEN

EmailOutboxStatus:
QUEUED
SENT
FAILED
SKIPPED

EmailTemplateKey:
ORDER_CONFIRMATION
PURCHASE_INVOICE
AUTH_PASSWORD_RESET
ADMIN_NEW_ORDER_ALERT
ORDER_STATUS_UPDATE
APPRECIATION_AFTER_DELIVERY

EmailEventType:
QUEUED
SENT
FAILED
RETRIED
SKIPPED
```

## Required Tables

```txt
users
customer_profiles
admin_profiles
addresses
categories
products
product_variants
product_images
delivery_zones
delivery_surcharge_rules
carts
cart_items
orders
order_items
order_status_events
payment_settings
payment_confirmation_events
invoices
reviews
email_templates
email_outbox
email_events
email_preferences
audit_logs
site_settings
media_assets
```

## Snapshot Rules

Orders must preserve what the customer saw at purchase time.

Required order/order item snapshots:

```txt
product_name_snapshot
variant_name_snapshot
unit_price_snapshot
line_total
delivery_zone_name_snapshot
delivery_base_fee_snapshot
delivery_surcharge_snapshot
delivery_total_fee_snapshot
payment_instruction_snapshot
proof_whatsapp_number_snapshot
```

Old invoices must not change when products, prices, delivery zones, surcharge rules, or payment settings are updated later.

## Core Model Checklist

### Users and Roles

- [x] `users` supports authenticated customer and admin identities.
- [x] `users.role` supports `CUSTOMER`, `MODERATOR`, and `SUPER_ADMIN`.
- [x] `admin_profiles` can mark admin access active/inactive.
- [x] Moderator restrictions are enforceable server-side.

Implemented Phase 2 auth tables:

```txt
users
accounts
sessions
verification_tokens
admin_profiles
```

Implemented Phase 2 auth fields:

```txt
users.id
users.name
users.email
users.email_verified
users.image
users.phone
users.role
users.last_login_at
users.created_at
users.updated_at

admin_profiles.id
admin_profiles.user_id
admin_profiles.role
admin_profiles.status
admin_profiles.created_at
admin_profiles.updated_at
```

### Catalog

- [x] `categories` support active state and sort order.
- [x] `products` support category, slug, price, status, feature flags, and sort order.
- [x] `product_variants` support product-specific option pricing.
- [x] `product_images` and `media_assets` support controlled image records.
- [x] Product price snapshot utility exists for checkout/order item creation.

Implemented Phase 3 catalog/media tables:

```txt
categories
products
product_variants
product_images
media_assets
```

Implemented Phase 3 enums:

```txt
ProductStatus:
ACTIVE
HIDDEN
OUT_OF_STOCK

MediaAssetStatus:
PENDING_UPLOAD
READY
DELETED

MediaUploadPurpose:
PRODUCT_IMAGE
```

### Delivery

- [x] `delivery_zones` are admin-editable.
- [x] `delivery_surcharge_rules` can represent the 6 PM NGN 500 surcharge.
- [x] Pickup can be represented with zero delivery fee and no surcharge.
- [x] Delivery fee snapshots are stored on orders.

Implemented Phase 4 delivery tables:

```txt
delivery_zones
delivery_surcharge_rules
```

Implemented Phase 4 enum:

```txt
DeliveryMethod:
DELIVERY
PICKUP
```

Delivery amount rules:

```txt
- base_fee and surcharge amount are integer minor units in NGN.
- The default 6 PM surcharge is NGN 500, stored as 50000.
- Pickup quotes return zero delivery base fee, surcharge, and total.
- Phase 4 includes the delivery fee snapshot builder; Phase 5 stores those values on orders.
```

### Orders

- [x] `orders` support guest and authenticated checkout.
- [x] `orders.order_number` is unique and customer-safe.
- [x] `orders.status` uses the approved order lifecycle enum.
- [x] `orders.payment_status` is separate from fulfillment status.
- [x] `order_items` store product, variant, unit price, quantity, and line total snapshots.
- [x] Every status change creates an `order_status_events` row.

Implemented Phase 5 checkout/order tables:

```txt
carts
cart_items
orders
order_items
order_status_events
```

Implemented Phase 5 enums:

```txt
CustomerType:
GUEST
AUTHENTICATED

OrderStatus:
PENDING_PAYMENT
PAYMENT_UNDER_REVIEW
PAYMENT_CONFIRMED
PREPARING
READY_FOR_PICKUP
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
REJECTED

PaymentStatus:
UNPAID
PROOF_SENT_ON_WHATSAPP
UNDER_REVIEW
CONFIRMED
REJECTED

PaymentMethod:
BANK_TRANSFER
```

Checkout snapshot fields now implemented on `orders`:

```txt
customer_name_snapshot
customer_phone_snapshot
customer_email_snapshot
delivery_address_snapshot
delivery_zone_id
delivery_zone_name_snapshot
delivery_base_fee_snapshot
delivery_surcharge_snapshot
delivery_total_fee_snapshot
subtotal
total
payment_instruction_snapshot
proof_whatsapp_number_snapshot
```

### Payments

- [x] `payment_settings` store active Moniepoint transfer instructions.
- [x] Only `SUPER_ADMIN` can update payment settings.
- [x] Orders snapshot payment instructions.
- [x] Payment confirmation/rejection creates `payment_confirmation_events`.
- [x] Payment confirmation/rejection creates audit logs.

Implemented Phase 6 payment tables:

```txt
payment_settings
payment_confirmation_events
```

Implemented Phase 6 payment fields:

```txt
payment_settings.id
payment_settings.setting_key
payment_settings.bank_name
payment_settings.account_name
payment_settings.account_number
payment_settings.payment_instruction
payment_settings.proof_whatsapp_number
payment_settings.is_active
payment_settings.updated_by_user_id
payment_settings.created_at
payment_settings.updated_at

payment_confirmation_events.id
payment_confirmation_events.order_id
payment_confirmation_events.from_status
payment_confirmation_events.to_status
payment_confirmation_events.changed_by_user_id
payment_confirmation_events.reason
payment_confirmation_events.created_at
```

Payment workflow rules:

```txt
- payment_settings.setting_key is unique and uses the singleton value default.
- Checkout reads only active payment settings.
- Checkout stores payment_instruction_snapshot and proof_whatsapp_number_snapshot on orders.
- Payment confirmation/rejection writes payment_confirmation_events and audit_logs.
```

### Invoices

- [x] `invoices` store invoice number and HTML snapshot.
- [x] Optional PDF URL can be added after layout is stable.
- [x] Invoice records are linked to orders.

Implemented Phase 7 invoice table:

```txt
invoices
```

Implemented Phase 7 invoice fields:

```txt
invoices.id
invoices.order_id
invoices.invoice_number
invoices.public_access_token
invoices.html_snapshot
invoices.pdf_url
invoices.generated_at
invoices.created_at
```

Invoice rules:

```txt
- invoices.order_id is unique so each order has one invoice.
- invoices.invoice_number is unique and derived from the order number.
- invoices.public_access_token gates public access.
- invoices.html_snapshot stores the full printable invoice HTML.
- Invoice HTML uses order snapshots and does not change after product, delivery, or payment settings updates.
```

### Reviews

- [ ] Reviews default to `PENDING`.
- [ ] Only approved reviews appear publicly.
- [ ] Review moderation writes audit logs.

### Email

- [x] Email templates support only approved transactional use cases.
- [x] Email outbox supports queue, sent, failed, skipped, retry count, and error message.
- [x] Email failure does not break order creation.
- [x] Email events log queued, sent, failed, skipped, and retried actions.
- [x] Email preferences table exists for authenticated customer controls.

Implemented Phase 8 email tables:

```txt
email_templates
email_outbox
email_events
email_preferences
```

Email rules:

```txt
- Emails are queued through EmailService before any send attempt.
- Resend API access is isolated to the email module.
- Disabled templates create SKIPPED outbox records instead of sending.
- Failed sends record error_message and next_attempt_at for retry.
- order_id + template_key is unique so duplicate order emails, including appreciation emails, are prevented.
```

### Audit

- [x] Admin-critical mutations can write `audit_logs` through the audit service.
- [x] Audit logs capture actor, action, target, metadata, and timestamp.
- [x] `audit_logs.actor_user_id` is linked to `users.id` with `ON DELETE SET NULL`.

## Index and Constraint Checklist

- [x] Unique product slug.
- [x] Unique category slug.
- [x] Unique order number.
- [x] Unique invoice number.
- [x] Index orders by status, payment status, created date, customer phone, and user.
- [x] Index order items by order and product.
- [ ] Index reviews by status and product.
- [x] Index email outbox by status and next attempt time.
- [x] Index payment confirmation events by order, status, actor, and creation time.
- [ ] Index audit logs by actor, action, target, and creation time.

## Open Schema Decisions

- [ ] Final ID strategy: `cuid`, `uuid`, or database-generated IDs.
- [ ] Phone normalization format.
- [ ] Address structure for delivery orders.
- [ ] Whether cart storage is needed for guests or only authenticated users.
- [ ] Whether order lookup uses token, phone verification, or both.
- [ ] Whether email preferences exist in v1 or are deferred until authenticated profiles mature.
- [ ] Exact audit metadata JSON shape.
