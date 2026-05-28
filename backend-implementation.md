# Sunflour Bakery Backend Implementation Plan

**Project:** Sunflour Bakery Restaurant Website + Ordering Platform  
**Document:** Backend Implementation Plan  
**Scope:** Backend only  
**Standard:** Built for honour and for excellence  
**Primary users:** Customers, guest buyers, moderators, super admins  
**Backend style:** API-first modular backend inside Next.js App Router  

---

## 1. Product Architecture Decision

### 1.1 Backend objective

Build a secure, maintainable, API-first backend that powers:

- Public menu and product browsing.
- Cart and checkout.
- Delivery fee calculation, including the **6 PM surcharge of ₦500**.
- Manual bank-transfer payment workflow.
- WhatsApp proof-of-payment handoff.
- Downloadable purchase invoices.
- Controlled transactional emails through Resend.
- Customer profiles and guest checkout.
- Reviews with moderation.
- Admin dashboard and operational controls.
- Order lifecycle management from creation to delivery/cancellation.

The backend must make Sunflour’s operation clear, trustworthy, and admin-editable without requiring code changes for daily business updates.

---

## 2. Recommended Backend Stack

```txt
Runtime / App Backend: Next.js App Router Route Handlers + Server Functions
Language: TypeScript strict mode
Database: CockroachDB
ORM: Prisma
Authentication: Auth.js / NextAuth with Google OAuth and credentials/email reset support if needed
Email: Resend + React Email templates
Object Storage: Cloudflare R2
Validation: Zod
Authorization: Role-based access control
Hosting: Vercel
CI/CD: GitHub -> Vercel Preview -> Production
Testing: Vitest, Playwright/API integration tests, Prisma test database
Observability: Structured logs, admin audit logs, error monitoring later
```

### 2.1 Why modular monolith first

Use a modular monolith first, not a separate NestJS backend. Sunflour needs speed, reliability, and a clean admin workflow. A separate backend can come later only if traffic, integrations, or team size justify it.

Backend code should still be organized like a professional service:

```txt
src/
  app/
    api/
      v1/
        public/
        customer/
        admin/
        webhooks/
  server/
    auth/
    db/
    config/
    modules/
      menu/
      cart/
      checkout/
      orders/
      delivery/
      payments/
      invoices/
      email/
      reviews/
      admin/
      users/
      media/
      audit/
    lib/
      validation/
      errors/
      rate-limit/
      security/
      money/
      date-time/
      idempotency/
```

Route handlers receive requests. Modules own business logic. Database access stays behind repositories/services. This keeps the code testable and prevents route files from becoming messy.

---

## 2.2 What Good Looks Like: Industry Reference Map

This project should feel simple to the customer and powerful to the business. That is the pattern used by the best commerce and restaurant systems: the buyer sees a clear path, while the backend quietly handles pricing, state, payment, fulfillment, records, and admin control.

These references are not for copying UI blindly. They are the architectural standards that show how mature systems make complex operations feel easy.

### 2.2.1 Vercel Commerce / Next.js Commerce

**Reference:** https://github.com/vercel/commerce

Vercel Commerce is the closest engineering reference for how a modern Next.js commerce frontend/backend should feel: fast, server-rendered, App Router-first, and built around React Server Components, Server Actions, Suspense, and optimistic UI patterns.

What Sunflour should learn from it:

```txt
- Keep the customer journey fast and simple.
- Let server-side rendering and caching protect speed.
- Keep product browsing lightweight.
- Make cart/order actions feel instant.
- Use clean App Router structure instead of random pages and endpoints.
- Treat performance as a product feature, not an afterthought.
```

How we apply it:

```txt
Public menu must load fast.
Product details must be clear.
Cart and checkout must avoid friction.
Backend routes must remain predictable.
No customer should feel the backend complexity.
```

### 2.2.2 Vercel Platform Standard

**References:**

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/cron-jobs

Vercel is not just hosting here. It is part of the engineering operating model.

What Sunflour should learn from Vercel:

```txt
- Every pull request should create a Preview Deployment.
- Every backend change should be tested before production.
- Production secrets must live in Vercel Environment Variables, not in GitHub.
- Preview and Production environments must be separated.
- Scheduled backend jobs, such as email outbox retries, can be handled with Vercel Cron Jobs.
- Deployment should be boring, repeatable, and auditable.
```

How we apply it:

```txt
GitHub branch -> Pull Request -> Vercel Preview -> test checkout/admin/email -> merge -> Production.
```

No direct production edits. No secret in code. No “it works on my laptop” launch.

### 2.2.3 Stripe Checkout and Payment Metadata

**References:**

- https://docs.stripe.com/api/checkout/sessions
- https://docs.stripe.com/metadata

Stripe makes payment feel simple because it creates a clear payment session and uses metadata/webhooks to reconcile the payment with the business order.

Sunflour is not using Stripe/Paystack in v1, but the backend principle still applies.

What Sunflour should learn from it:

```txt
- Every payment attempt must be tied to a real order.
- Payment state must be separate from order fulfillment state.
- Payment instructions must be snapshot-based.
- The system must be able to reconcile a customer payment with an internal order number.
- The customer must never guess what to do after checkout.
```

How we apply it:

```txt
Order created -> invoice generated -> Moniepoint details shown -> WhatsApp proof message generated -> admin verifies -> payment status changes.
```

Manual payment should still behave like a disciplined payment workflow.

### 2.2.4 Shopify Order Admin Model

**References:**

- https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status
- https://shopify.dev/docs/api/admin-graphql/latest/objects/Order

Shopify is strong because it separates the business meaning of an order from payment, fulfillment, and admin views.

What Sunflour should learn from it:

```txt
- Order status, payment status, and fulfillment/delivery progress are not the same thing.
- Admins need operational views, not raw database records.
- Line items must preserve what the customer bought even if products change later.
- Admin filtering matters: pending payment, preparing, delivery, delivered, cancelled.
```

How we apply it:

```txt
Order.status tracks fulfillment lifecycle.
Order.payment_status tracks manual payment verification.
OrderItems store product/variant/price snapshots.
Dashboard cards are filtered operational views.
```

### 2.2.5 Toast Restaurant Orders API

**References:**

- https://toastportaltesting.redoc.ly/orders/overview/
- https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html

Toast is a restaurant-focused reference. Its order model includes guest orders, checks, ordered items, prices, payments, discounts, and customer data. Its docs also emphasize retrieving/calculating prices before posting an order.

What Sunflour should learn from it:

```txt
- Restaurant orders require price calculation before final order creation.
- Guest checkout is normal in food ordering.
- Orders should support updates after creation.
- Payment can be added/confirmed after the order exists.
- Ordered items, price totals, and customer details must remain traceable.
```

How we apply it:

```txt
/api/v1/public/delivery/quote calculates delivery before checkout.
/api/v1/public/checkout recalculates product prices and delivery server-side.
Orders can exist before payment is confirmed.
Admin updates the lifecycle after manual verification.
```

### 2.2.6 Square Orders API

**Reference:** https://developer.squareup.com/docs/orders-api/what-it-does

Square is useful as a reference for treating an order as a unified object that can contain line items, service charges, taxes/fees, fulfillment information, and payments.

What Sunflour should learn from it:

```txt
- Do not scatter pricing logic across the UI.
- Keep the order as the source of truth.
- Treat delivery surcharge as a first-class applied rule, not a hidden frontend calculation.
- Keep fulfillment/delivery details attached to the order lifecycle.
```

How we apply it:

```txt
Delivery base fee + 6 PM surcharge are calculated server-side and saved as order snapshots.
```

### 2.2.7 Resend Transactional Email Standard

**Reference:** https://resend.com/docs/send-with-nextjs

Resend should be treated as infrastructure, not as random email code inside order modules.

What Sunflour should learn from it:

```txt
- Email must be transactional, intentional, and logged.
- Email templates should be controlled.
- Email failures must not break order creation.
- Email sending should be isolated behind one backend service.
```

How we apply it:

```txt
Order module queues events.
Email module renders and sends.
Outbox records success/failure.
Admin can see and retry failed sends.
```

### 2.2.8 OWASP File Upload Standard

**Reference:** https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

Food platforms are image-heavy. Product images, cake photos, and menu assets must be uploaded safely.

What Sunflour should learn from it:

```txt
- Never trust file extensions alone.
- Limit file size.
- Rename files on upload.
- Store files outside the app server.
- Only authorized admins should upload.
```

How we apply it:

```txt
Admin requests signed upload -> backend validates intent -> file goes to Cloudflare R2 -> media_assets record is stored -> product references media asset.
```

---

## 2.3 AI-Agent-Ready Engineering Context

We are building with AI agents in VS Code and GitHub workflows: Codex, Claude, Copilot, and similar tools. That only works well if the repository has strong context, strict boundaries, and repeatable checks.

### 2.3.1 Required repository instruction files

Create these files early:

```txt
/AGENTS.md
/CLAUDE.md
/.github/copilot-instructions.md
/docs/backend-implementation.md
/docs/api-contracts.md
/docs/database-schema.md
/docs/order-lifecycle.md
```

Recommended meaning:

```txt
AGENTS.md:
Shared project instructions for Codex, Copilot coding agent, and other agentic tools.

CLAUDE.md:
Claude-specific memory/instructions if Claude Code is used.

.github/copilot-instructions.md:
GitHub Copilot repository instructions for chat, inline edits, and agent work.
```

Useful references:

```txt
Codex AGENTS.md: https://developers.openai.com/codex/guides/agents-md
GitHub Copilot custom instructions: https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot
Next.js AI agents guide: https://nextjs.org/docs/app/guides/ai-agents
Vercel AI coding agent plugin: https://vercel.com/docs/agent-resources/vercel-plugin
Vercel AGENTS.md evaluation note: https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals
```

### 2.3.2 What every AI agent must know before touching backend code

Put this in `AGENTS.md` and repeat in relevant task prompts:

```txt
Project: Sunflour Bakery.
Backend style: API-first modular monolith inside Next.js App Router.
Database: CockroachDB via Prisma.
Storage: Cloudflare R2.
Email: Resend through EmailService only.
Auth: Auth.js with RBAC.
Hosting: Vercel.

Rules:
- Do not trust client prices, subtotals, delivery fees, surcharge, or totals.
- Recalculate all money values on the server.
- Do not call Resend directly outside the email module.
- Do not upload files without backend validation and signed upload flow.
- Do not expose admin routes without requireRole().
- Do not change payment settings outside super_admin routes.
- Do not skip tests.
- Do not add production dependencies without approval.
- Keep route handlers thin; business logic belongs in modules/services.
- Every admin-critical mutation must write audit_logs.
- Every order status change must write order_status_events.
- Preserve order/invoice snapshots.
```

### 2.3.3 Agent task packet format

Every task given to `@Codex`, `@Claude`, or `@Copilot` should follow this format:

```txt
Task:
Implement Phase X: [name].

Read first:
- docs/backend-implementation.md
- docs/api-contracts.md
- docs/database-schema.md
- AGENTS.md

Scope:
- Only implement the files needed for this phase.
- Do not redesign unrelated modules.
- Do not change product rules without asking.

Acceptance criteria:
- [paste acceptance criteria from this document]

Required checks:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build

Output expected:
- Summary of changed files.
- Tests added.
- Risks or unresolved questions.
```

### 2.3.4 Agent review checklist

Before accepting AI-generated backend code, check:

```txt
Architecture:
- Does the route handler stay thin?
- Is business logic in a service/module?
- Are database writes transaction-safe where needed?

Security:
- Is request input validated with Zod?
- Is RBAC enforced server-side?
- Are secrets absent from code?
- Are file uploads controlled?

Money/order correctness:
- Are prices recalculated server-side?
- Are delivery fees and surcharge snapshotted?
- Are old invoices protected from future price edits?

Operations:
- Are audit logs written for admin-critical actions?
- Are status transitions validated?
- Does the dashboard metric match its definition?

Testing:
- Are unit/integration tests included?
- Do tests cover failure paths?
- Does the build pass?
```

### 2.3.5 Vercel-specific AI agent instructions

When agents work on deployment, environment, cron, or backend runtime behavior, they must use current Vercel and Next.js docs instead of relying on old training memory.

Agent instruction:

```txt
When implementing Vercel/Next.js behavior, consult the local Next.js version docs and current Vercel docs. Do not assume old Pages Router patterns. Prefer App Router Route Handlers for API contracts. Use Server Actions only where they simplify internal form mutations and do not replace public API contracts.
```

This matters because Next.js and Vercel evolve quickly. AI agents must be forced toward current documentation and project rules.

---

## 3. Core Domain Model

### 3.1 User types

There are three practical buyer identities:

1. **Guest buyer** — does not log in, completes checkout using name and phone.
2. **Authenticated buyer** — signs in with Google and reuses profile data.
3. **Admin user** — super_admin or moderator.

### 3.2 Admin roles

```txt
super_admin:
- Full access.
- Manage admins.
- Manage products and categories.
- Manage delivery zones and surcharge settings.
- Manage payment settings.
- Manage email settings/templates.
- Manage order lifecycle.
- Manage reviews.
- View dashboard and audit logs.

moderator:
- View dashboard.
- Manage order statuses.
- Confirm payment manually.
- Update product availability.
- Moderate reviews.
- Cannot change bank/payment settings.
- Cannot change email sender/settings.
- Cannot manage admin accounts.
- Cannot delete critical records.
```

---

## 4. Database Design

### 4.1 Essential tables

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

### 4.2 Important table responsibilities

#### users
Stores identity for authenticated users.

Important fields:

```txt
id
email
name
image
phone
role: CUSTOMER | MODERATOR | SUPER_ADMIN
created_at
updated_at
last_login_at
```

#### customer_profiles
Stores buyer details independent of auth provider.

```txt
id
user_id nullable
full_name
phone
default_address_id nullable
created_at
updated_at
```

#### categories
```txt
id
name
slug
description
sort_order
is_active
created_at
updated_at
```

#### products
```txt
id
category_id
name
slug
description
base_price
status: ACTIVE | HIDDEN | OUT_OF_STOCK
is_featured
is_popular
sort_order
created_at
updated_at
```

#### product_variants
Use this for pizza sizes, cake sizes, bread sizes, ice cream options, etc.

```txt
id
product_id
name
price
sku nullable
is_active
sort_order
created_at
updated_at
```

#### delivery_zones
Admin-editable location pricing.

```txt
id
name
slug
base_fee
is_active
sort_order
created_at
updated_at
```

#### delivery_surcharge_rules
Use this for the 6 PM + ₦500 rule.

```txt
id
name
starts_at_time          // "18:00"
ends_at_time nullable   // optional if rule applies till close of day
amount                  // 500
is_active
created_at
updated_at
```

Backend rule:

```txt
If checkout/order creation time is 6:00 PM or later and surcharge rule is active,
add ₦500 to the selected zone delivery fee.
```

Store the final calculated delivery fee on the order as a snapshot.

#### orders
```txt
id
order_number
user_id nullable
customer_type: GUEST | AUTHENTICATED
customer_name_snapshot
customer_phone_snapshot
customer_email_snapshot nullable
delivery_method: DELIVERY | PICKUP
delivery_zone_id nullable
delivery_zone_name_snapshot nullable
delivery_base_fee_snapshot
delivery_surcharge_snapshot
delivery_total_fee_snapshot
subtotal
total
status
payment_status
payment_method: BANK_TRANSFER
payment_instruction_snapshot
invoice_id nullable
customer_note nullable
admin_note nullable
created_at
updated_at
cancelled_at nullable
delivered_at nullable
```

#### order_items
Snapshot product data so old invoices remain correct even if prices change later.

```txt
id
order_id
product_id nullable
variant_id nullable
product_name_snapshot
variant_name_snapshot nullable
unit_price_snapshot
quantity
line_total
created_at
```

#### order_status_events
Every order status change must be tracked.

```txt
id
order_id
from_status nullable
to_status
changed_by_user_id nullable
reason nullable
created_at
```

#### payment_settings
Only super_admin can update.

```txt
id
bank_name
account_name
account_number
payment_instruction
proof_whatsapp_number
is_active
updated_by_user_id
created_at
updated_at
```

#### invoices
```txt
id
order_id
invoice_number
html_snapshot
pdf_url nullable
generated_at
created_at
```

Start with a printable invoice page. Add PDF storage to R2 after the invoice layout is stable.

#### reviews
```txt
id
user_id nullable
order_id nullable
product_id nullable
customer_name_snapshot
rating
comment
status: PENDING | APPROVED | REJECTED | HIDDEN
reviewed_by_user_id nullable
created_at
updated_at
```

#### email_templates
Controlled email templates.

```txt
id
key
name
subject
body_schema_or_component_key
is_active
updated_by_user_id
created_at
updated_at
```

Template keys:

```txt
ORDER_CONFIRMATION
PURCHASE_INVOICE
ORDER_STATUS_UPDATE
APPRECIATION
AUTH_PASSWORD_RESET
ADMIN_NEW_ORDER_ALERT
```

#### email_outbox
Use outbox pattern so emails are controlled, trackable, and retry-safe.

```txt
id
recipient_email
recipient_name nullable
template_key
subject_snapshot
payload_json
status: QUEUED | SENT | FAILED | SKIPPED
resend_email_id nullable
error_message nullable
attempt_count
next_attempt_at nullable
sent_at nullable
created_at
updated_at
```

#### email_preferences
Useful when authenticated customers exist.

```txt
id
user_id
transactional_enabled default true
marketing_enabled default false
appreciation_enabled default true
created_at
updated_at
```

Do not send promotional emails until explicit permission and business approval exist.

#### audit_logs
Critical for admin trust.

```txt
id
actor_user_id nullable
action
entity_type
entity_id
before_json nullable
after_json nullable
ip_address nullable
user_agent nullable
created_at
```

---

## 5. Order Lifecycle

### 5.1 Status model

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

### 5.2 Payment status model

```txt
UNPAID
PROOF_SENT_ON_WHATSAPP
UNDER_REVIEW
CONFIRMED
REJECTED
```

### 5.3 Recommended flow

```txt
1. Customer creates order.
2. Backend calculates subtotal, delivery fee, 6 PM surcharge if applicable, and total.
3. Backend creates order with PENDING_PAYMENT + UNPAID.
4. Backend generates invoice.
5. Backend queues order confirmation email if customer email exists.
6. Customer downloads invoice.
7. Customer clicks WhatsApp proof button.
8. WhatsApp opens with prefilled message containing order number and total.
9. Admin manually verifies payment proof from WhatsApp.
10. Admin marks payment confirmed.
11. Order moves to PAYMENT_CONFIRMED.
12. Moderator/super_admin moves order through PREPARING -> OUT_FOR_DELIVERY -> DELIVERED.
```

### 5.4 WhatsApp proof message format

```txt
Hello Sunflour Bakery, I have made payment for my order.

Order Number: {{order_number}}
Customer Name: {{customer_name}}
Total Amount: ₦{{total}}

I am sending my payment proof now.
```

Backend should not claim payment is confirmed until admin confirms it.

---

## 6. Delivery Fee Logic

### 6.1 Required rules

- Delivery zones are managed by admin.
- Each zone has a base fee.
- Pickup has ₦0 delivery fee.
- From **6:00 PM**, add **₦500** to delivery orders.
- The surcharge must be admin-editable.
- The order must store snapshots of base fee, surcharge, and final fee.

### 6.2 Delivery fee calculation function

```ts
calculateDeliveryFee({
  deliveryMethod,
  zoneBaseFee,
  orderDateTime,
  surchargeRule,
})
```

Expected output:

```txt
baseFee
surchargeAmount
finalDeliveryFee
appliedRules
```

### 6.3 Example

```txt
Zone: Marian
Base fee: ₦1,000
Checkout time: 6:35 PM
Surcharge: ₦500
Final delivery fee: ₦1,500
```

---

## 7. Email Architecture With Resend

### 7.1 Email principles

Emails must be useful, controlled, and transactional. No noisy marketing. No surprise blasts. No uncontrolled sending from random backend files.

### 7.2 Email use cases

Build now:

```txt
ORDER_CONFIRMATION
PURCHASE_INVOICE
AUTH_PASSWORD_RESET
ADMIN_NEW_ORDER_ALERT
ORDER_STATUS_UPDATE
APPRECIATION_AFTER_DELIVERY
```

Reserve for later:

```txt
PROMOTIONAL_CAMPAIGNS
BIRTHDAY_OFFERS
CUSTOMER_SEGMENTS
NEWSLETTERS
WIN-BACK_AUTOMATION
```

### 7.3 Controlled email system

All email sending should pass through:

```txt
EmailService.queueEmail()
EmailService.sendQueuedEmail()
EmailTemplateService.renderTemplate()
EmailPolicyService.canSend()
```

No module should call Resend directly except the email infrastructure module.

### 7.4 Email outbox flow

```txt
1. Business event happens.
2. Backend writes email_outbox row in same logical flow.
3. Email worker/server job sends queued email through Resend.
4. Backend stores Resend ID and sent status.
5. Failures are retried with attempt count and error message.
```

### 7.5 Email sending safeguards

- Do not send order emails if no customer email exists.
- Do not send appreciation email before order is delivered.
- Do not send appreciation email more than once per order.
- Do not send marketing emails unless explicitly enabled later.
- Log all failed email attempts.
- Super_admin controls sender settings and active templates.
- Use verified sending domain before production launch.

---

## 8. Admin Dashboard Backend Metrics

### 8.1 Required dashboard cards

```txt
Today’s orders
Pending payment confirmation
Preparing orders
Total users
Number of guests
Cancelled orders
Out for delivery
Delivered orders
Total sales estimate
Top ordered items
Low/hidden/out-of-stock products
Recent reviews pending approval
```

### 8.2 Metric definitions

#### Today’s orders
Count of orders created from start of current business day to now.

#### Pending payment confirmation
Orders where:

```txt
payment_status IN (PROOF_SENT_ON_WHATSAPP, UNDER_REVIEW)
OR status = PENDING_PAYMENT
```

Depending on operation, split later into:

```txt
Awaiting customer proof
Awaiting admin verification
```

#### Preparing orders
Orders with status:

```txt
PREPARING
```

#### Total users
Count of authenticated customer users.

#### Number of guests
Count of unique guest orders or guest buyer profiles. In v1, use number of orders where:

```txt
customer_type = GUEST
```

Later, deduplicate by phone number.

#### Cancelled orders
Orders with status:

```txt
CANCELLED
```

#### Out for delivery
Orders with status:

```txt
OUT_FOR_DELIVERY
```

#### Delivered orders
Orders with status:

```txt
DELIVERED
```

#### Total sales estimate
Sum of delivered and payment-confirmed order totals. Use a conservative default:

```txt
SUM(total) WHERE payment_status = CONFIRMED AND status != CANCELLED AND status != REJECTED
```

Label it as estimate because payment is manually verified.

#### Top ordered items
Aggregate `order_items` by product snapshot and quantity for a selected period.

#### Low/hidden/out-of-stock products
Products with status:

```txt
HIDDEN
OUT_OF_STOCK
```

If inventory is added later, include low stock.

#### Recent reviews pending approval
Reviews with status:

```txt
PENDING
```

---

## 9. API Design

### 9.1 Public endpoints

```txt
GET    /api/v1/public/menu
GET    /api/v1/public/categories
GET    /api/v1/public/products
GET    /api/v1/public/products/:slug
GET    /api/v1/public/delivery-zones
POST   /api/v1/public/delivery/quote
POST   /api/v1/public/checkout
GET    /api/v1/public/orders/:orderNumber/invoice
POST   /api/v1/public/reviews
```

### 9.2 Customer endpoints

```txt
GET    /api/v1/customer/profile
PATCH  /api/v1/customer/profile
GET    /api/v1/customer/orders
GET    /api/v1/customer/orders/:orderNumber
GET    /api/v1/customer/orders/:orderNumber/invoice
POST   /api/v1/customer/reviews
```

### 9.3 Admin endpoints

```txt
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/:id
PATCH  /api/v1/admin/orders/:id/status
PATCH  /api/v1/admin/orders/:id/payment-status
PATCH  /api/v1/admin/orders/:id/admin-note

GET    /api/v1/admin/categories
POST   /api/v1/admin/categories
PATCH  /api/v1/admin/categories/:id

GET    /api/v1/admin/products
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/:id
PATCH  /api/v1/admin/products/:id/status

GET    /api/v1/admin/delivery-zones
POST   /api/v1/admin/delivery-zones
PATCH  /api/v1/admin/delivery-zones/:id

GET    /api/v1/admin/delivery-surcharge-rules
POST   /api/v1/admin/delivery-surcharge-rules
PATCH  /api/v1/admin/delivery-surcharge-rules/:id

GET    /api/v1/admin/reviews
PATCH  /api/v1/admin/reviews/:id/status

GET    /api/v1/admin/payment-settings
PATCH  /api/v1/admin/payment-settings

GET    /api/v1/admin/email/templates
PATCH  /api/v1/admin/email/templates/:id
GET    /api/v1/admin/email/outbox
POST   /api/v1/admin/email/outbox/:id/retry

POST   /api/v1/admin/media/presigned-upload
GET    /api/v1/admin/audit-logs
```

---

## 10. Security Requirements

### 10.1 Backend security baseline

- TypeScript strict mode.
- Validate every request body with Zod.
- Sanitize strings displayed in admin/customer UI.
- RBAC on every admin endpoint.
- Never trust client-calculated price, subtotal, delivery fee, or total.
- Recalculate order totals on the server.
- Use secure cookies for sessions.
- Rate-limit checkout, reviews, auth reset, and upload endpoints.
- Use idempotency keys for checkout/order creation.
- Use audit logs for admin actions.
- Use signed URLs for R2 uploads.
- Restrict file type and file size for uploads.
- Store secrets in environment variables only.
- Do not expose internal database IDs where order number is safer.

### 10.2 Admin protection

Admin access must require:

```txt
Authenticated session
Approved admin email
Role check
Active admin profile
```

### 10.3 Critical actions requiring audit logs

```txt
Payment setting update
Delivery fee update
Surcharge rule update
Product price update
Product status update
Order payment confirmation
Order cancellation
Admin creation/removal
Email template update
Review approval/rejection
```

---

## 11. Backend Implementation Phases

# Phase 0 — Product Backend Lockdown

## Goal
Freeze the backend rules before coding so implementation does not drift.

## Build

- Confirm official Sunflour address.
- Confirm Moniepoint bank details.
- Confirm WhatsApp proof number.
- Confirm admin emails.
- Confirm delivery zones and base prices.
- Confirm 6 PM surcharge rule.
- Confirm whether pickup is allowed(Allowed).
- Confirm order operating hours.
- Confirm email sender domain/name.
- Use `AGENTS.md` to create rules for AI agents.
- Create `CLAUDE.md` if Claude Code will be used.
- Create `.github/copilot-instructions.md` for GitHub Copilot.
- Create `codex-instructions.md` for Codex agents.
- Create `docs/api-contracts.md` and `docs/database-schema.md` placeholders.
- Confirm Vercel project, Preview Deployment workflow, and environment variable ownership.

## Tests

- Product rule review checklist.
- Stakeholder confirmation checklist.

## Acceptance criteria

- Delivery pricing sheet is complete.
- Payment details are verified.
- Admin role list is approved.
- Email use cases are approved.
- AI agent instruction files exist.
- Vercel Preview/Production environment plan is clear.
- No backend coding begins without these details.

## Outcome
A stable backend rulebook and AI-agent-ready repository context.

---

# Phase 1 — Backend Foundation

## Goal
Set up a professional backend base that supports secure development.

## Build

- Configure TypeScript strict mode.
- Configure environment variable validation.
- Install and configure Prisma.
- Connect CockroachDB.
- Create base Prisma schema.
- Create database migration workflow.
- Create backend folder structure.
- Create API response format.
- Create error handling utilities.
- Create Zod validation pattern.
- Create money/currency utilities.
- Create date/time utility for delivery surcharge.
- Set up test database strategy.

## Tests

- Database connection test.
- Prisma migration test.
- Environment validation test.
- API health endpoint test.
- Money formatting/unit test.
- Date/time surcharge utility unit test.

## Acceptance criteria

- App builds successfully.
- API health endpoint works.
- Database migration runs cleanly.
- Invalid env config fails fast.
- Test suite runs in CI.

## Outcome
Backend foundation ready for domain modules.

---

# Phase 2 — Authentication, RBAC, and Admin Access

## Goal
Secure the backend before building admin operations.

## Build

- Configure Auth.js/NextAuth.
- Add Google OAuth for customer/admin login.
- Create users table integration.
- Create admin_profiles.
- Add roles: CUSTOMER, MODERATOR, SUPER_ADMIN.
- Create backend `requireAuth()` helper.
- Create backend `requireRole()` helper.
- Protect admin endpoints.
- Add admin allowlist seed.
- Add audit logging utility.

## Tests

- Unauthenticated users cannot access admin endpoint.
- Customer cannot access admin endpoint.
- Moderator can access allowed endpoints.
- Moderator cannot update payment settings.
- Super_admin can access all admin endpoints.
- Role checks are enforced server-side.

## Acceptance criteria

- Admin routes are inaccessible without a valid admin session.
- Role permissions are tested.
- Admin actions can write audit logs.
- No admin permission is controlled only by frontend UI.

## Outcome
Secure admin access layer.

---

# Phase 3 — Menu, Categories, Products, and Media

## Goal
Make the menu database-driven and admin-editable.

## Build

- Categories CRUD.
- Products CRUD.
- Product variants CRUD.
- Product image records.
- Product status: ACTIVE, HIDDEN, OUT_OF_STOCK.
- Public menu endpoint.
- Public product detail endpoint.
- Admin product status update.
- Cloudflare R2 presigned upload endpoint.
- File validation rules.
- Seed initial menu.

## Tests

- Public menu returns only active products.
- Hidden products do not appear publicly.
- Out-of-stock products appear only if business wants them visible, but cannot be ordered.
- Admin can create/update products.
- Moderator can update availability only if allowed.
- Invalid image/file upload request is rejected.
- Product price updates do not affect old order snapshots.

## Acceptance criteria

- Menu is fully powered by database.
- Admin can update products without code changes.
- Product images are stored through controlled upload flow.
- Public endpoints are fast and clean.

## Outcome
Sunflour menu becomes a real backend-controlled catalog.

---

# Phase 4 — Delivery Zones and 6 PM Surcharge

## Goal
Implement accurate, admin-editable delivery pricing.

## Build

- Delivery zones CRUD.
- Surcharge rules CRUD.
- Public delivery zones endpoint.
- Delivery quote endpoint.
- Server-side delivery fee calculator.
- Pickup option with ₦0 delivery fee.
- Order fee snapshot structure.

## Tests

- Delivery zone returns correct base fee.
- Before 6 PM, no surcharge is applied.
- At exactly 6:00 PM, ₦500 surcharge applies.
- After 6 PM, ₦500 surcharge applies.
- Pickup ignores delivery surcharge.
- Inactive zones cannot be selected.
- Order stores delivery fee snapshots.

## Acceptance criteria

- Delivery quote is calculated server-side.
- Admin can manage(create/edit) zones and fees without code changes.
- Admin can edit delivery zones.
- Admin can edit surcharge rule.
- Checkout cannot manipulate delivery fee from frontend.

## Outcome
Accurate delivery pricing engine.

---

# Phase 5 — Cart and Checkout Backend

## Goal
Create reliable checkout for guest and authenticated buyers.

## Build

- Cart model for authenticated users.
- Stateless guest checkout support.
- Checkout validation schema.
- Server-side price recalculation.
- Idempotency key support for order creation.
- Customer snapshot creation.
- Order number generation.
- Order item snapshot creation.
- Initial order status: PENDING_PAYMENT.
- Initial payment status: UNPAID.
- Checkout response with invoice link and WhatsApp proof message link.

## Tests

- Guest can create valid order.
- Authenticated user can create valid order.
- Invalid phone/address/order items are rejected.
- Out-of-stock products cannot be ordered.
- Hidden products cannot be ordered.
- Client-submitted price manipulation is ignored.
- Duplicate checkout request with same idempotency key does not create duplicate order.
- Order number is unique.

## Acceptance criteria

- Checkout creates a complete order.
- Order totals are server-trusted.
- Guest and authenticated flows both work.
- Duplicate accidental submissions are protected.

## Outcome
A safe and usable order creation backend.

---

# Phase 6 — Payment Settings and Manual Payment Workflow

## Goal
Support Sunflour’s Moniepoint transfer workflow clearly and safely.

## Build

- Payment settings table.
- Super_admin-only payment settings endpoint.
- Payment instruction snapshot on order.
- WhatsApp proof message generator.
- Admin payment status update endpoint.
- Payment confirmation event log.
- Audit log for payment confirmation/rejection.

## Tests

- Moderator cannot change payment account details.
- Super_admin can update payment settings.
- Order stores payment account snapshot.
- Payment status can only follow valid transitions.
- Payment confirmation writes audit log.
- Rejected payment requires reason.

## Acceptance criteria

- Bank details are controlled from admin.
- Payment confirmation remains manual and honest.
- Every payment decision is traceable.

## Outcome
Manual payment becomes organized and trustworthy.

---

# Phase 7 — Invoice Backend

## Goal
Generate reliable purchase invoices for every order.

## Build

- Invoice number generator.
- Invoice HTML renderer.
- Invoice snapshot storage.
- Public invoice access by order number with safe token or controlled lookup.
- Customer invoice access for logged-in customers.
- Admin invoice access.
- Optional PDF generation later.
- Use a dependency-light templating approach for maintainability.
- Use dependency where needed so taht we dont overbuild the invoice system but also have a clean way to generate HTML.

## Tests

- Invoice is generated after order creation.
- Invoice totals match order snapshots.
- Product price changes do not change old invoice.
- Delivery fee changes do not change old invoice.
- Invalid order number cannot access invoice.
- Customer cannot access another customer’s private invoice if authenticated route is used.

## Acceptance criteria

- Every order has invoice access.
- Invoice is stable and snapshot-based.
- Invoice works without email.
- Invoice can later be attached to email.

## Outcome
Professional invoice infrastructure.

---

# Phase 8 — Resend Email System

## Goal
Add controlled transactional emails without creating spam or operational risk.

## Build

- Resend client wrapper.
- React Email templates .
- Email template registry.
- Email outbox table.
- Email queue function.
- Email send function.
- Retry failed email endpoint/job.
- Optional Vercel Cron route for periodic email outbox processing.
- Email logs for admin.
- Admin Manual emailing 
- Order confirmation email.
- Purchase invoice email.
- Password reset/auth email if email auth is enabled.
- New order alert email for admin.
- Appreciation email after delivery.

## Tests

- Email is not sent directly from random modules.
- Order confirmation is queued only when email exists.
- Invoice email includes correct order data.
- Appreciation email sends only once after delivery.
- Failed email is marked failed and can be retried.
- Invalid template key is rejected.
- Email sending can be disabled per template.

## Acceptance criteria

- All emails pass through EmailService.
- All email sends are logged.
- Resend API failures do not break order creation.
- Email outbox can be processed manually or by scheduled Vercel Cron.
- Transactional emails are controlled and professional.

## Outcome
Reliable email layer for confirmations, invoices, reset flows, and appreciation.

---

# Phase 9 — Order Lifecycle Admin Backend

## Goal
Allow admins to operate the full order lifecycle safely.

## Build

- Admin order list endpoint with filters.
- Admin order detail endpoint.
- Status transition validator.
- Payment status transition validator.
- Admin status update endpoint.
- Admin notes.
- Order cancellation with reason.
- Delivered timestamp.
- Order status event history.
- Audit logs.
- Optional customer email status updates.

## Tests

- Invalid status transition is rejected.
- Cancelled order cannot move to delivered.
- Delivered order cannot move back without super_admin override.
- Every status change writes order_status_event.
- Every admin action writes audit log.
- Moderator can update allowed statuses.
- Customer cannot update order status.

## Acceptance criteria

- Admin can manage orders from pending to delivered.
- Order history is traceable.
- Critical status changes are protected.

## Outcome
Sunflour gets a real operational order backend.

## Implementation status — 2026-05-28

Done:

```txt
- Admin order list/detail endpoints.
- Admin status update endpoint.
- Admin note update endpoint.
- Server-side status transition validator.
- Terminal order protections for CANCELLED, REJECTED, and DELIVERED.
- order_status_events for every status mutation.
- audit_logs for admin order mutations.
- delivered_at and cancelled_at timestamp handling.
- Payment workflow hardened so CANCELLED/REJECTED orders cannot receive later payment status updates.
```

Deferred:

```txt
- Super admin break-glass override policy for terminal orders. This requires explicit business approval before implementation.
- Customer email status update queueing remains optional because status-update email deduplication needs a separate outbox policy.
```

## Implementation prompt for AI agents

```txt
Role:
You are a senior backend engineer working in the Sunflour Bakery modular monolith. You specialize in order lifecycle systems, RBAC, auditability, and safe operational workflows for commerce/restaurant platforms.

Goal:
Give Sunflour staff a dependable order operations backend where every status change is valid, traceable, and safe for manual Moniepoint payment operations.

Context:
Read first:
- AGENTS.md
- backend-implementation.md
- docs/api-contracts.md
- docs/database-schema.md
- docs/order-lifecycle.md
- src/server/modules/payments/*
- src/server/modules/checkout/*
- src/server/modules/email/*
- existing admin API route patterns under src/app/api/v1/admin

Current backend facts:
- Checkout creates orders, order items, initial order_status_events, invoices, and email outbox records.
- Manual payment confirmation already updates payment_status, may update order.status, writes payment_confirmation_events, and writes audit logs.
- Order statuses are PENDING_PAYMENT, PAYMENT_UNDER_REVIEW, PAYMENT_CONFIRMED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REJECTED.
- Payment status and fulfillment status are separate concepts.

Task:
Implement Phase 9: Order Lifecycle Admin Backend.

Deliver these artifacts:
- Admin order list endpoint with filters for status, paymentStatus, date range, orderNumber, customer phone, customer type, and pagination.
- Admin order detail endpoint with items, invoice summary, payment events, order status timeline, notes, and customer snapshots.
- Order status transition validator.
- Admin order status update endpoint.
- Admin notes update support.
- Cancellation/rejection path with reason.
- Delivered timestamp handling.
- Order status event history creation for every status change.
- Audit logging for every admin-critical action.
- Optional customer email status update queueing through EmailService only.

Constraints:
- Use pnpm only.
- Keep route handlers thin: validate request, authorize, call service, return typed response.
- Business logic belongs in src/server/modules/orders or a similarly scoped module.
- Validate every body, query, and route param with Zod.
- Enforce RBAC server-side. Customers must never update order status.
- Moderators can operate normal lifecycle transitions but must not perform protected super_admin overrides unless the policy explicitly allows it.
- Cancelled orders must not move to delivered without explicit super_admin override logic.
- Delivered orders must not move backward without explicit super_admin override logic.
- Every status mutation must create order_status_events.
- Every admin-critical mutation must write audit_logs.
- Never recalculate historical order totals or invoice totals in this phase.
- Do not send email directly. Queue through EmailService only, and do not let email failure break order updates.
- Do not redesign payment confirmation unless needed to share validators cleanly.

Output Format:
Return a concise engineering closeout with these headings:
1. Changed files
2. API routes added or changed
3. Tests added or changed
4. Checks run
5. Risks or unresolved decisions

Examples:
Use existing admin route patterns from payment, delivery, product, and email routes. Do not invent a new response envelope.

Evaluation Criteria:
The implementation is good if:
- Invalid transitions fail with a typed API error.
- Valid transitions update the order and write exactly the expected event/audit records.
- Admin list/detail responses are enough for the frontend admin order UI without exposing secrets.
- Moderator and super_admin permissions are tested.
- Payment status and order status remain separate.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Evaluation Criteria. If any criterion fails, revise the implementation before reporting completion. If a business rule is genuinely undecided, leave a specific TODO in docs/order-lifecycle.md and call it out in the final response.
```

---

# Phase 10 — Customer Profile and Guest Tracking

## Goal
Support mobile-first customers while respecting guest checkout reality.

## Build

- Customer profile endpoint.
- Saved customer phone/name.
- Saved addresses.
- Customer order history.
- Guest order lookup by order number and phone.
- Guest count metric.
- Basic reorder backend support later.

## Tests

- Authenticated customer can view own orders.
- Customer cannot view another user’s orders.
- Guest lookup requires order number + phone.
- Guest orders are counted correctly.
- Profile update validates phone/name/address.

## Acceptance criteria

- Logged-in users get a simple profile.
- Guests can still order without friction.
- Admin dashboard can distinguish authenticated users from guest buyers.

## Outcome
Balanced customer identity system.

## Implementation status — 2026-05-28

Done:

```txt
- Customer profile read/update endpoints.
- customer_profiles table for authenticated buyer name and phone.
- Authenticated customer order list/detail endpoints.
- Guest order lookup endpoint requiring order number and normalized phone match.
- Guest lookup returns a limited customer-safe shape and does not expose admin notes, audit logs, internal ids, or admin-only history.
- Guest order count helper for dashboard metrics.
```

Deferred:

```txt
- Saved addresses table/endpoints. Address structure remains an open product decision.
- Reorder support. It should reuse checkout availability validation in a later phase.
```

## Implementation prompt for AI agents

```txt
Role:
You are a senior backend engineer building customer identity and guest-order lookup for a mobile-first restaurant commerce platform. You optimize for low-friction checkout, privacy, and predictable customer APIs.

Goal:
Let returning customers manage simple profile data and order history without making guest checkout harder.

Context:
Read first:
- AGENTS.md
- backend-implementation.md
- docs/api-contracts.md
- docs/database-schema.md
- docs/order-lifecycle.md
- src/server/auth/*
- src/server/modules/checkout/*
- src/server/modules/invoices/*
- existing customer route patterns under src/app/api/v1/customer

Current backend facts:
- Orders can belong to authenticated users or guests.
- Checkout snapshots customer name, phone, and optional email.
- Invoice access exists for authenticated customers and tokenized public invoice links.
- Guest order lookup token strategy is still an open decision in docs/api-contracts.md.

Task:
Implement Phase 10: Customer Profile and Guest Tracking.

Deliver these artifacts:
- Customer profile read endpoint.
- Customer profile update endpoint for name and phone.
- Saved addresses model/service/endpoints if the schema decision is clear; otherwise document the exact deferred address structure.
- Authenticated customer order history endpoint.
- Authenticated customer order detail endpoint.
- Guest order lookup endpoint requiring order number and phone, with safe response shape.
- Guest count metric support for dashboard use.
- Basic reorder support only if it can reuse existing product availability and checkout validation safely; otherwise document it as later.

Constraints:
- Use pnpm only.
- Do not force login for checkout.
- Validate every request with Zod.
- Customers can read only their own authenticated orders.
- Guest lookup must not reveal whether an order exists unless the phone number also matches.
- Guest lookup must not expose admin notes, audit logs, internal ids, or unsafe customer data.
- Do not trust phone text without normalization or strict comparison rules.
- Do not change old order snapshots when profile data changes.
- Keep customer routes under /api/v1/customer and guest-safe lookup under /api/v1/public or another documented public namespace.
- Do not add broad customer CRM features in this phase.

Output Format:
Return a concise engineering closeout with these headings:
1. Changed files
2. Customer and guest API contracts
3. Tests added or changed
4. Checks run
5. Risks or unresolved decisions

Examples:
Use existing invoice customer access as the ownership model. Use checkout customer snapshot fields as the privacy boundary for guest lookup.

Evaluation Criteria:
The implementation is good if:
- Authenticated users can view profile and own orders.
- Authenticated users cannot view another user's orders.
- Guest lookup requires both order number and phone and returns a limited customer-safe view.
- Profile updates validate name and phone.
- Guest orders can be counted for dashboard metrics.
- Checkout remains guest-friendly.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Evaluation Criteria. If guest lookup token/phone policy is not safely decidable from docs, do not invent broad behavior; implement the conservative path and document the remaining decision.
```

---

# Phase 11 — Reviews and Moderation

## Goal
Allow customers to give reviews without letting spam damage the brand.

## Build

- Public review submission endpoint.
- Optional order-linked review endpoint.
- Review status: PENDING, APPROVED, REJECTED, HIDDEN.
- Admin review list endpoint.
- Admin review moderation endpoint.
- Dashboard pending review metric.
- Rate limiting for public review submissions.

## Tests

- Public review enters PENDING state.
- Pending reviews do not appear publicly.
- Approved reviews appear publicly.
- Rejected/hidden reviews do not appear publicly.
- Admin review action writes audit log.
- Review spam/rate limit works.

## Acceptance criteria

- Reviews are useful and brand-safe.
- Admin controls what goes public.
- Dashboard shows pending review count.

## Outcome
Trust-building review system with moderation.

## Implementation status — 2026-05-28

Done:

```txt
- ReviewStatus enum and reviews table.
- Public review submission endpoint.
- Public approved-review listing endpoint.
- Admin review list endpoint.
- Admin moderation endpoint for APPROVED, REJECTED, and HIDDEN.
- Moderation audit logs with before/after status.
- Rate limit on public review submission.
- Pending review count helper for dashboard metrics.
```

Deferred:

```txt
- Mandatory order-linked reviews. Current v1 supports moderated non-order-linked reviews first.
```

## Implementation prompt for AI agents

```txt
Role:
You are a senior backend engineer implementing brand-safe review collection and moderation for a public restaurant ordering platform. You prioritize spam control, customer trust, and admin auditability.

Goal:
Allow customers to submit useful reviews while ensuring nothing appears publicly until Sunflour approves it.

Context:
Read first:
- AGENTS.md
- backend-implementation.md
- docs/api-contracts.md
- docs/database-schema.md
- docs/order-lifecycle.md
- existing public/admin route patterns under src/app/api/v1
- src/server/modules/audit/*
- src/server/auth/rbac.ts

Current backend facts:
- Public reviews must enter PENDING state first.
- Only approved reviews can appear publicly.
- Admin moderation must write audit logs.
- Dashboard metrics later need pending review counts.

Task:
Implement Phase 11: Reviews and Moderation.

Deliver these artifacts:
- ReviewStatus enum and reviews table if not already implemented.
- Public review submission endpoint.
- Optional order-linked review endpoint only if ownership/guest verification is clear.
- Public approved reviews endpoint or inclusion strategy for approved product reviews.
- Admin review list endpoint with filters.
- Admin review moderation endpoint for APPROVED, REJECTED, and HIDDEN.
- Audit logging for every moderation action.
- Rate limiting for public review submission using existing or newly scoped rate-limit utilities.
- Pending review metric helper for dashboard phase.

Constraints:
- Use pnpm only.
- Validate every request with Zod.
- Never show PENDING, REJECTED, or HIDDEN reviews publicly.
- Public submission must not allow clients to choose APPROVED status.
- Review moderation requires MODERATOR or SUPER_ADMIN server-side authorization.
- Moderation actions must write audit_logs with before/after status.
- Rate limits must fail safely and return the standard API error envelope.
- Do not build marketing/testimonial automation in this phase.
- Do not expose customer phone, email, admin notes, or internal audit details publicly.

Output Format:
Return a concise engineering closeout with these headings:
1. Changed files
2. Public review APIs
3. Admin moderation APIs
4. Tests added or changed
5. Checks run
6. Risks or unresolved decisions

Examples:
Use product/catalog response visibility as the pattern: public endpoints return only approved and safe fields; admin endpoints return operational fields behind RBAC.

Evaluation Criteria:
The implementation is good if:
- Public submissions always create PENDING reviews.
- Public listing returns only APPROVED reviews.
- Admin moderation changes status and writes audit logs.
- Rate limiting covers the public submission endpoint.
- Invalid ratings/comments are rejected with field errors.
- Dashboard can later count pending reviews without duplicating query logic.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Evaluation Criteria. If order-linked reviews need an unresolved identity decision, implement non-order-linked public reviews first and document the order-linking decision explicitly.
```

---

# Phase 12 — Admin Dashboard Metrics

## Goal
Give Sunflour’s team a clean operational view of business activity.

## Build

- Dashboard metrics service.
- Today’s orders query.
- Pending payment confirmation query.
- Preparing orders query.
- Total users query.
- Guest order count query.
- Cancelled orders query.
- Out for delivery query.
- Delivered orders query.
- Total sales estimate query.
- Top ordered items query.
- Hidden/out-of-stock products query.
- Pending reviews query.
- Date range support.

## Tests

- Metrics return correct numbers from seeded test data.
- Sales estimate excludes cancelled/rejected orders.
- Guest count uses guest orders.
- Top items aggregation works.
- Dashboard endpoint requires admin role.

## Acceptance criteria

- Dashboard loads from one backend endpoint.
- Metrics match database reality.
- Moderators can view dashboard.
- Sensitive settings are not exposed in dashboard response.

## Outcome
Admin dashboard backend ready for UI.

## Implementation status — 2026-05-28

Done:

```txt
- Admin dashboard metrics service.
- One MODERATOR/SUPER_ADMIN dashboard endpoint.
- Timezone-aware default date range using APP_TIME_ZONE.
- Counts for orders, pending payment confirmation, preparing, users, guests, cancelled, out for delivery, delivered, and pending reviews.
- Conservative confirmed-sales estimate.
- Top ordered items aggregation from order item snapshots.
- Hidden/out-of-stock product summary.
- Recent pending review summary.
```

## Implementation prompt for AI agents

```txt
Role:
You are a senior backend engineer building operational analytics for a restaurant admin dashboard. You focus on accurate database-backed metrics, fast queries, and safe role-gated responses.

Goal:
Give Sunflour staff one backend endpoint that summarizes today's operational priorities without exposing sensitive settings or making frontend guesses.

Context:
Read first:
- AGENTS.md
- backend-implementation.md
- docs/api-contracts.md
- docs/database-schema.md
- docs/order-lifecycle.md
- src/server/modules/checkout/*
- src/server/modules/payments/*
- src/server/modules/email/*
- src/server/modules/reviews/* if implemented
- existing admin route patterns under src/app/api/v1/admin

Current backend facts:
- Sales estimate must be conservative: SUM(total) where payment_status = CONFIRMED and status is not CANCELLED or REJECTED.
- Dashboard data must come from backend queries, not frontend guesses.
- Moderators can view dashboard but must not receive sensitive payment/email settings.

Task:
Implement Phase 12: Admin Dashboard Metrics.

Deliver these artifacts:
- Dashboard metrics service.
- Admin dashboard metrics endpoint.
- Date range parsing with a safe default for today in the application timezone.
- Counts for today's orders, pending payment confirmation, preparing orders, total users, guests, cancelled orders, out for delivery, delivered orders.
- Conservative total sales estimate.
- Top ordered items aggregation.
- Low/hidden/out-of-stock products summary.
- Pending reviews summary if reviews are implemented; otherwise a documented placeholder that cannot break the endpoint.
- Focused query tests with seeded/mocked data.

Constraints:
- Use pnpm only.
- Validate query params with Zod.
- Require MODERATOR or SUPER_ADMIN.
- Do not expose bank account numbers, email template bodies, secrets, audit metadata, or customer PII beyond what dashboard cards need.
- Keep aggregation in backend service code, not route handlers.
- Avoid N+1 queries.
- Use integer minor units for money.
- Label total sales as estimate in the response contract.
- Keep date logic explicit about timezone.

Output Format:
Return a concise engineering closeout with these headings:
1. Changed files
2. Dashboard response shape
3. Metrics implemented
4. Tests added or changed
5. Checks run
6. Risks or unresolved decisions

Examples:
Use payment workflow definitions for sales estimate and order lifecycle docs for status-based cards.

Evaluation Criteria:
The implementation is good if:
- One admin endpoint returns all dashboard cards needed by the frontend.
- Metrics match database reality in tests.
- Sales estimate excludes CANCELLED and REJECTED orders and includes only CONFIRMED payments.
- Guest count is based on guest orders, not guessed from missing users.
- Top items aggregation uses order item snapshots.
- Sensitive settings are absent from the response.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Evaluation Criteria. If a metric depends on a later phase, return a stable zero/empty shape and document why, instead of leaving the frontend to guess.
```

---

# Phase 13 — Hardening, Performance, and Launch Readiness

## Goal
Prepare backend for real customers and business operations.

## Build

- Rate limits.
- Request logging.
- Error monitoring hooks.
- Security headers where backend controls them.
- API response consistency.
- Database indexes.
- Query optimization.
- Seed production data.
- Backup/export strategy.
- Admin handover checklist.
- Production environment variables.
- Vercel deployment checks.

## Tests

- Production build passes.
- API smoke tests pass on preview deployment.
- Admin protected routes remain protected.
- Checkout works on preview.
- Email test works with verified sender.
- R2 upload test works.
- Dashboard query performance acceptable.
- Delivery surcharge works in production timezone.

## Acceptance criteria

- Backend is production-ready.
- Critical flows tested on mobile and preview deployment.
- Admin can operate without developer intervention.
- No secret is committed to GitHub.

## Outcome
Backend ready for launch.

## Implementation status — 2026-05-28

Done:

```txt
- Rate limits on checkout, guest lookup, public review submission, media presign, and email cron processing.
- Sanitized API 500 error logging.
- API security headers through Next.js headers().
- Prisma schema indexes for customer/guest, dashboard, and review query patterns.
- Production seed, backup/export, environment, and Preview smoke-test checklists documented in docs/vercel-deployment.md.
- pnpm 11 install hardening with pnpm-workspace.yaml build-script allowlist.
```

Remaining launch owner actions:

```txt
- Configure Vercel project/environment values.
- Confirm CockroachDB backup/restore ownership.
- Verify Resend sender domain and R2 bucket credentials.
- Decide whether production rate limiting needs a durable shared store before higher traffic.
```

## Implementation prompt for AI agents

```txt
Role:
You are a principal backend engineer performing production-readiness hardening for a Next.js App Router commerce backend on Vercel. You specialize in security, observability, rate limiting, database performance, and launch discipline.

Goal:
Prepare Sunflour's backend for real customer traffic and daily business operations without introducing risky last-minute rewrites.

Context:
Read first:
- AGENTS.md
- backend-implementation.md
- frontend-implimentation.md
- docs/api-contracts.md
- docs/database-schema.md
- docs/order-lifecycle.md
- docs/vercel-deployment.md if present
- .env.example
- package.json scripts
- existing API routes under src/app/api/v1
- existing server modules under src/server

Current backend facts:
- Core backend phases now include auth/RBAC, catalog/media, delivery pricing, checkout/orders, manual payment workflow, invoice access, email outbox, and upcoming admin/customer/review/dashboard operations.
- Vercel Preview and Production environment variables must be separated.
- No secrets may be committed to GitHub.
- Every production-facing flow must preserve customer clarity, business trust, and operational simplicity.

Task:
Implement Phase 13: Hardening, Performance, and Launch Readiness.

Deliver these artifacts:
- Rate limiting for sensitive public and auth-adjacent endpoints.
- Request logging and structured error monitoring hooks that do not expose secrets.
- Security headers where this backend controls them.
- API response consistency audit and fixes.
- Database index review and migration for slow/high-cardinality queries.
- Query optimization for dashboard/order/customer/review flows.
- Production seed strategy for required business data.
- Backup/export strategy documentation.
- Admin handover checklist.
- Production environment variable checklist.
- Vercel deployment checks and smoke-test checklist.

Constraints:
- Use pnpm only.
- Do not introduce broad rewrites during hardening.
- Do not add dependencies unless the value is specific and documented.
- Preserve all existing API contracts unless a bug requires a documented breaking change.
- Do not log secrets, payment account numbers, access tokens, customer proof links, or raw auth/session data.
- Rate limits must protect public review submission, checkout, guest order lookup, upload presign, and cron/webhook endpoints where relevant.
- Security changes must not break Vercel runtime compatibility.
- Production seed data must not contain fake secrets or committed real credentials.
- Any launch checklist must be actionable, not generic.

Output Format:
Return a concise engineering closeout with these headings:
1. Changed files
2. Hardening completed
3. Performance/index changes
4. Deployment and environment checklist updates
5. Tests and smoke checks
6. Remaining launch risks

Examples:
Use existing API response envelope and existing validation/error utilities. Use Vercel Preview workflow as the deployment reference.

Evaluation Criteria:
The implementation is good if:
- Sensitive endpoints have explicit rate-limit coverage.
- Logs help diagnose production issues without leaking private data.
- API errors remain consistent and customer-safe.
- Indexes match real query patterns introduced in phases 9 through 12.
- Preview smoke checklist covers checkout, invoice, email, R2 upload, admin auth, dashboard, delivery surcharge, and payment workflow.
- Environment variables are documented with owner, preview value strategy, and production value strategy.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Evaluation Criteria. If any hardening item would require an external production credential or Vercel account action, document the exact owner action instead of faking completion.
```

---

## 12. What to Build Now vs Later

### Build now

```txt
Authentication and roles
Dynamic menu
Product variants
Cloudflare R2 media upload
Delivery zones
6 PM surcharge
Guest checkout
Authenticated checkout
Manual payment instructions
WhatsApp proof handoff
Invoice generation
Controlled Resend emails
Admin order lifecycle
Admin dashboard metrics
Reviews moderation
Audit logs
```

### Reserve for later

```txt
Paystack/card payment
Live rider tracking
SMS notifications
Full loyalty/rewards system
Advanced inventory management
Kitchen display system
Coupons and promotions
Marketing email campaigns
AI food recommendations
Multi-branch management
Mobile app
```

### Why

The first version must solve the current operational pain:

```txt
Customers need to see the menu, trust the price, place orders, pay clearly, send proof, and receive an invoice.
Admins need to control products, delivery fees, orders, payment confirmations, reviews, and dashboard metrics.
```

Anything beyond this should wait until order volume proves the need.

---

## 13. Backend Definition of Done

A backend feature is not done until:

```txt
1. API contract is defined.
2. Request validation exists.
3. Authorization is enforced server-side.
4. Business logic is tested.
5. Database writes are safe.
6. Errors are handled cleanly.
7. Audit log exists where needed.
8. UI can consume the response without guessing.
9. Edge cases are tested.
10. Acceptance criteria are met.
```

---

## 14. Critical Backend Risks

### Risk 1: Manual payment confusion

Mitigation:

- Clear order status.
- Clear payment status.
- Invoice before proof.
- Admin confirmation only after WhatsApp proof.

### Risk 2: Delivery fee disputes

Mitigation:

- Server-side delivery calculation.
- Display base fee + surcharge clearly.
- Snapshot fee on order.

### Risk 3: Admin mistakes

Mitigation:

- RBAC.
- Audit logs.
- Restrict payment settings to super_admin.
- Validate status transitions.

### Risk 4: Email noise

Mitigation:

- Outbox system.
- Template controls.
- No direct Resend calls outside email module.
- Appreciation email once per delivered order.

### Risk 5: Old invoice changing after price updates

Mitigation:

- Snapshot all order item prices.
- Snapshot delivery fee.
- Snapshot payment instruction.
- Store invoice HTML snapshot.

---

## 15. Good Backend Context for AI Agents

This section should be copied into future prompts when assigning backend work to AI agents.

### 15.1 The product we are building

```txt
Sunflour Bakery is not just getting a website.
Sunflour is getting a mobile-first ordering backend that powers menu browsing, cart, checkout, manual Moniepoint payment, WhatsApp proof handoff, invoice generation, delivery fee calculation, reviews, customer profiles, admin roles, and dashboard operations.
```

### 15.2 The quality bar

```txt
Good looks like Stripe-level payment clarity, Shopify-level order separation, Toast-level restaurant order thinking, Square-level order object discipline, Vercel-level deployment workflow, and Resend-level email control.
```

### 15.3 What must stay simple

```txt
Customer menu browsing.
Customer checkout.
Payment instruction.
Invoice access.
WhatsApp proof handoff.
Admin order queue.
Product update flow.
Delivery fee management.
```

### 15.4 What must be powerful behind the scenes

```txt
Server-side pricing.
Delivery surcharge rules.
Immutable order snapshots.
Status transition validation.
RBAC.
Audit logs.
Email outbox.
R2 media safety.
Dashboard aggregation.
Preview deployment testing.
```

### 15.5 Agent anti-patterns to reject

```txt
Reject code that:
- Puts business logic directly inside route handlers.
- Trusts frontend totals.
- Sends email directly from random files.
- Hardcodes delivery fees or product prices.
- Allows moderators to change payment settings.
- Updates order status without an order_status_event.
- Updates critical admin data without audit_logs.
- Adds dependencies without clear value.
- Ignores Vercel runtime/deployment constraints.
- Makes checkout depend on email being available.
```

---

## 16. Immediate Engineering Order

Follow this order strictly:

```txt
1. Backend rule confirmation.
2. Database schema.
3. Auth and RBAC.
4. Menu/product backend.
5. Delivery fee and surcharge engine.
6. Checkout/order creation.
7. Manual payment workflow.
8. Invoice generation.
9. Resend email outbox.
10. Admin order lifecycle.
11. Customer profile and guest lookup.
12. Reviews moderation.
13. Dashboard metrics.
14. Hardening and launch tests.
```

This order prevents building beautiful UI on top of weak operations.

---

## 17. Final Backend Principle

Sunflour’s backend must not be a collection of random endpoints. It must be a small, disciplined business operating system.

Every important backend action should answer:

```txt
Who did it?
What changed?
Why was it allowed?
What did the customer see?
What did the business record?
Can we prove it later?
```

That is how this platform becomes trustworthy.

**Built for honour and for excellence.**
