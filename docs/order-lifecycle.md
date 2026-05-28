# Order Lifecycle - Sunflour Bakery

Status: active draft. Phase 5 checkout creates initial order records, Phase 6 adds manual payment verification events, Phase 7 adds invoice creation, Phase 8 queues transactional email through an outbox, and Phase 9 adds admin lifecycle operations.

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

Complete this matrix before implementing status transition validation.

| From | Allowed To | Actor | Required Reason | Side Effects |
| --- | --- | --- | --- | --- |
| `PENDING_PAYMENT` | `PAYMENT_UNDER_REVIEW` | Customer/Admin/System | No | payment proof received |
| `PAYMENT_UNDER_REVIEW` | `PAYMENT_CONFIRMED` | Admin | No | payment event, audit log |
| `PAYMENT_UNDER_REVIEW` | `REJECTED` | Admin | Yes | payment event, audit log |
| `PAYMENT_CONFIRMED` | `PREPARING` | Admin | No | order status event |
| `PREPARING` | `READY_FOR_PICKUP` | Admin | No | order status event |
| `PREPARING` | `OUT_FOR_DELIVERY` | Admin | No | order status event |
| `READY_FOR_PICKUP` | `DELIVERED` | Admin | No | delivered timestamp |
| `OUT_FOR_DELIVERY` | `DELIVERED` | Admin | No | delivered timestamp |
| any active status | `CANCELLED` | Admin | Yes | audit log |

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
- Super admin override behavior is intentionally deferred until the business approves an explicit break-glass policy.
- Payment status updates are blocked after an order is CANCELLED or REJECTED.
```

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

## Open Decisions

- [ ] Whether customer WhatsApp proof updates payment status automatically or remains an admin-only state change.
- [ ] Whether moderators can confirm payment in v1 or only mark proof as under review.
- [ ] Exact `SUPER_ADMIN` override policy for protected transitions.
- [ ] Customer notification triggers for each status.
- [ ] Whether `READY_FOR_PICKUP` applies only to pickup orders.
- [ ] Whether delivery orders can ever move to `READY_FOR_PICKUP`.
- [ ] Whether rejected payment cancels the order or leaves it awaiting corrected proof.
