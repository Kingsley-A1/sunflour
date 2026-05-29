# Order Lifecycle - Sunflour Bakery

Status: active Backend 2.0 contract. Checkout creates initial order records, manual payment verification writes payment events, invoices are snapshotted, transactional email is queued through a hardened outbox, and admin lifecycle operations enforce delivery-method-aware transitions.

## Source Of Truth

Read these files before editing lifecycle rules:

```txt
AGENTS.md
backend-implementation.md
docs/api-contracts.md
docs/database-schema.md
```

## Order Statuses

```txt
PENDING_PAYMENT
PAYMENT_UNDER_REVIEW
PAYMENT_CONFIRMED
PREPARING
READY_FOR_PICKUP
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
REJECTED
```

## Payment Statuses

```txt
UNPAID
PROOF_SENT_ON_WHATSAPP
UNDER_REVIEW
CONFIRMED
REJECTED
```

Payment status and order fulfillment status are separate. Manual Moniepoint transfer is not confirmed until an admin verifies it.

## Default Creation Flow

```txt
Checkout submitted
-> backend validates request
-> backend recalculates products, variants, subtotal, delivery fee, surcharge, and total
-> order is created with status PENDING_PAYMENT
-> payment status is set to UNPAID
-> invoice is generated from order snapshots
-> payment instruction snapshot is shown
-> WhatsApp proof handoff link is generated
```

## Manual Payment Flow

```txt
Order created
-> customer sends proof through WhatsApp
-> payment status moves to PROOF_SENT_ON_WHATSAPP or UNDER_REVIEW
-> admin verifies payment
-> payment status moves to CONFIRMED or REJECTED
-> order status moves according to allowed transition rules
```

## Lifecycle Checklist

- [x] Every order starts as `PENDING_PAYMENT`.
- [x] Every order starts with payment status `UNPAID`.
- [x] Payment confirmation is manual.
- [x] Email failure does not block order creation.
- [x] Every order status change writes `order_status_events`.
- [x] Every payment confirmation/rejection writes `payment_confirmation_events`.
- [x] Every payment confirmation/rejection writes `audit_logs`.
- [x] Checkout creates an invoice snapshot.
- [x] Cancelled orders cannot move to delivered without explicit `SUPER_ADMIN` override policy.
- [x] Rejected orders cannot continue normal fulfillment.
- [x] Customer-facing copy never claims payment is confirmed before admin verification.

## Transition Matrix

| From | Allowed To | Delivery Method | Actor | Required Reason | Side Effects |
| --- | --- | --- | --- | --- | --- |
| `PENDING_PAYMENT` | `PAYMENT_UNDER_REVIEW` | Any | Customer/Admin/System | No | payment proof received |
| `PAYMENT_UNDER_REVIEW` | `PAYMENT_CONFIRMED` | Any | Admin | No | payment event, audit log |
| `PAYMENT_UNDER_REVIEW` | `REJECTED` | Any | Admin | Yes | payment event, audit log |
| `PAYMENT_CONFIRMED` | `PREPARING` | Any | Admin | No | order status event |
| `PREPARING` | `READY_FOR_PICKUP` | `PICKUP` only | Admin | No | order status event |
| `PREPARING` | `OUT_FOR_DELIVERY` | `DELIVERY` only | Admin | No | order status event |
| `READY_FOR_PICKUP` | `DELIVERED` | `PICKUP` only | Admin | No | delivered timestamp |
| `OUT_FOR_DELIVERY` | `DELIVERED` | `DELIVERY` only | Admin | No | delivered timestamp |
| any active status | `CANCELLED` | Any | Admin | Yes | audit log |

Protected terminal statuses:

```txt
CANCELLED
REJECTED
DELIVERED
```

Current v1 policy:

```txt
- Terminal orders do not move backward.
- Terminal orders do not move to delivered from cancelled/rejected.
- Pickup orders cannot move to OUT_FOR_DELIVERY.
- Delivery orders cannot move to READY_FOR_PICKUP.
- Super admin override behavior is intentionally deferred until the business approves an explicit break-glass policy.
- Payment status updates are blocked after an order is CANCELLED or REJECTED.
```

## Moderator Payment Policy

Current v1 policy allows active `MODERATOR` and `SUPER_ADMIN` users to update payment status through the admin payment-status endpoint. Each payment decision writes `payment_confirmation_events` and `audit_logs`. This can be tightened later if Sunflour decides payment confirmation must be super-admin-only.

## Rejected Payment Behavior

Rejected payment requires a reason and moves the order to `REJECTED`. `REJECTED` is terminal in v1. The customer must place a new order or staff must use a future approved break-glass policy; no implicit retry loop is implemented.

## Phase 5 Implementation Note

Checkout creates:

```txt
- orders.status = PENDING_PAYMENT
- orders.payment_status = UNPAID
- orders.payment_method = BANK_TRANSFER
- one order_status_events row from null -> PENDING_PAYMENT
- product, variant, delivery fee, and payment instruction snapshots
```

Broader admin status transitions remain in later backend phases.

## Phase 7 Implementation Note

Checkout now creates:

```txt
- invoices row linked to the order.
- unique invoice_number.
- token-gated public invoice URL.
- html_snapshot generated from order snapshots.
```

Invoice HTML is stored before any email dependency exists. Phase 8 can attach or link the invoice snapshot without regenerating totals.

## Phase 8 Implementation Note

Checkout now attempts to queue:

```txt
- ORDER_CONFIRMATION email when customer_email_snapshot exists.
- ADMIN_NEW_ORDER_ALERT email when ADMIN_ORDER_ALERT_EMAILS is configured.
```

Email queue failures are swallowed after the order commits. Actual delivery is handled later by `email_outbox` processing, which records sent, failed, skipped, and retried events.

## Phase 9 Implementation Note

Admin order operations now support:

```txt
- Order list and detail endpoints.
- Status update endpoint.
- Admin note endpoint.
- Server-side transition validation.
- Delivery-method-aware fulfillment validation.
- order_status_events for every status mutation.
- audit_logs for every admin order mutation.
- delivered_at and cancelled_at timestamp handling.
```

## Phase 6 Implementation Note

Manual payment updates create:

```txt
- payment_confirmation_events row for every payment status update.
- order_status_events row when payment status changes the order status.
- audit_logs row for confirmation, rejection, or review state changes.
```

Payment status transitions currently allowed:

| From | Allowed To |
| --- | --- |
| `UNPAID` | `PROOF_SENT_ON_WHATSAPP`, `UNDER_REVIEW`, `CONFIRMED`, `REJECTED` |
| `PROOF_SENT_ON_WHATSAPP` | `UNDER_REVIEW`, `CONFIRMED`, `REJECTED` |
| `UNDER_REVIEW` | `CONFIRMED`, `REJECTED` |
| `CONFIRMED` | none |
| `REJECTED` | none |

Rejected payment requires a reason.

## Deferred Decisions

- [ ] Whether customer WhatsApp proof updates payment status automatically or remains an admin-only state change.
- [ ] Exact `SUPER_ADMIN` override policy for protected transitions.
- [ ] Customer notification triggers for each status.
