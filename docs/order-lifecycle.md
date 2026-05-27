# Order Lifecycle - Sunflour Bakery

Status: active draft. Phase 5 checkout now creates initial order records and status events.

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
-> invoice is generated
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
- [ ] Payment confirmation is manual.
- [ ] Email failure does not block order creation.
- [x] Every order status change writes `order_status_events`.
- [ ] Every payment confirmation/rejection writes `payment_confirmation_events`.
- [ ] Every payment confirmation/rejection writes `audit_logs`.
- [ ] Cancelled orders cannot move to delivered without explicit `SUPER_ADMIN` override policy.
- [ ] Rejected orders cannot continue normal fulfillment.
- [ ] Customer-facing copy never claims payment is confirmed before admin verification.

## Transition Matrix Placeholder

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

## Phase 5 Implementation Note

Checkout creates:

```txt
- orders.status = PENDING_PAYMENT
- orders.payment_status = UNPAID
- orders.payment_method = BANK_TRANSFER
- one order_status_events row from null -> PENDING_PAYMENT
- product, variant, delivery fee, and payment instruction snapshots
```

Payment verification, payment confirmation events, invoice records, and admin status transitions remain in later backend phases.

## Open Decisions

- [ ] Whether customer WhatsApp proof updates payment status automatically or remains an admin-only state change.
- [ ] Whether moderators can confirm payment in v1 or only mark proof as under review.
- [ ] Exact `SUPER_ADMIN` override policy for protected transitions.
- [ ] Customer notification triggers for each status.
- [ ] Whether `READY_FOR_PICKUP` applies only to pickup orders.
- [ ] Whether delivery orders can ever move to `READY_FOR_PICKUP`.
- [ ] Whether rejected payment cancels the order or leaves it awaiting corrected proof.
