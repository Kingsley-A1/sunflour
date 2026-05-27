# AGENTS.md — Sunflour Bakery

**Project:** Sunflour Bakery Restaurant Website + Ordering Platform  
**Company standard:** Built for honour and for excellence  
**Purpose:** Give Codex, Claude, Copilot, and other AI coding agents the exact operating context, architectural boundaries, quality bar, and implementation rules for this repository.  
**Package manager:** `pnpm` only. Do not use `npm`, `yarn`, or `bun` for dependency installation or scripts unless the human maintainer explicitly changes this standard.

---

## 1. Mission

We are building a mobile-first ordering platform for Sunflour Bakery, not a generic restaurant website.

The product must let customers:

- Browse the official Sunflour menu.
- Search and filter products.
- View product details, variants, prices, and availability.
- Add products to cart.
- Choose pickup or delivery.
- See delivery fees clearly, including the 6 PM surcharge.
- Checkout as guest or authenticated user.
- Receive clear Moniepoint bank-transfer instructions.
- Download or view a purchase invoice.
- Send payment proof through WhatsApp.
- Track order status where supported.
- Submit reviews safely.

The product must let admins:

- Manage products, categories, variants, images, and availability.
- Manage delivery zones and the 6 PM surcharge.
- Manage manual payment settings.
- Verify payment manually.
- Move orders through the full lifecycle.
- Moderate reviews.
- View operational dashboard metrics.
- Control transactional email behaviour.
- Audit critical business changes.

The platform must feel simple to customers and powerful to the business.

---

## 2. Required Context Before Any Task

Before making code changes, read the relevant documents:

```txt
docs/backend-implementation.md
docs/frontend-implimentation.md
AGENTS.md
```

If these files are not in `/docs`, check the repository root or ask the maintainer before proceeding.

For backend work, also read or create:

```txt
docs/api-contracts.md
docs/database-schema.md
docs/order-lifecycle.md
```

For frontend work, also read or create:

```txt
docs/design-system.md
docs/frontend-routes.md
docs/component-contracts.md
```

Do not invent product rules when the documentation is missing. Ask for clarification or leave a clear TODO with the exact decision required.

---

## 3. Stack

```txt
Framework: Next.js 16 App Router
UI runtime: React 19
Language: TypeScript strict mode
Package manager: pnpm
Database: CockroachDB
ORM: Prisma
Authentication: Auth.js / NextAuth
Email: Resend + React Email templates
Storage: Cloudflare R2
Validation: Zod
Styling: Tailwind CSS + CSS variables
Hosting: Vercel
CI/CD: GitHub -> Vercel Preview -> Production
Testing: Vitest, React Testing Library, Playwright, axe checks where relevant
```

### Package manager rule

Use only:

```bash
pnpm install
pnpm add <package>
pnpm add -D <package>
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Do not generate `package-lock.json`, `yarn.lock`, or `bun.lockb`. If any appear accidentally, remove them unless the human maintainer explicitly approves a package manager change.

---

## 4. Architecture Standard

This is a modular monolith inside Next.js App Router.

Do not build a messy app where route files own all business logic.

Preferred structure:

```txt
src/
  app/
    (public)/
    (customer)/
    admin/
    api/
      v1/
        public/
        customer/
        admin/
        webhooks/
  components/
    ui/
    layout/
    menu/
    cart/
    checkout/
    invoice/
    admin/
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
  styles/
  tests/
```

Route handlers should be thin:

```txt
Route handler -> validate request -> call service/module -> return typed response.
```

Business logic belongs in modules/services. UI logic belongs in components/hooks. Database access must be isolated and testable.

---

## 5. Product Rules That Must Not Be Broken

### 5.1 Money and pricing

Never trust prices from the frontend.

The backend must recalculate:

- Product price.
- Variant price.
- Quantity.
- Subtotal.
- Delivery base fee.
- 6 PM surcharge.
- Final delivery fee.
- Order total.

Every order must store snapshots:

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
```

Old invoices must not change when products, prices, delivery zones, or payment settings are updated later.

### 5.2 Delivery rule

Delivery zones are admin-editable.

From **6:00 PM**, delivery orders receive an additional **₦500 surcharge**, unless the surcharge rule is disabled by an authorized admin.

Pickup must have ₦0 delivery fee and must not receive the 6 PM delivery surcharge.

### 5.3 Manual payment rule

Sunflour uses manual Moniepoint transfer in v1.

The system must not claim a payment is confirmed until an admin verifies it.

Correct flow:

```txt
Order created -> invoice generated -> payment instruction shown -> WhatsApp proof handoff -> admin verifies -> payment confirmed -> order progresses.
```

### 5.4 Email rule

All email must go through the email module.

Allowed use cases now:

```txt
ORDER_CONFIRMATION
PURCHASE_INVOICE
AUTH_PASSWORD_RESET
ADMIN_NEW_ORDER_ALERT
ORDER_STATUS_UPDATE
APPRECIATION_AFTER_DELIVERY
```

Do not send promotional campaigns, newsletters, birthday offers, or marketing automation unless the human maintainer explicitly approves it.

Do not call Resend directly from random modules or UI files.

Use:

```txt
EmailService.queueEmail()
EmailService.sendQueuedEmail()
EmailTemplateService.renderTemplate()
EmailPolicyService.canSend()
```

Email failure must not break order creation.

### 5.5 Reviews rule

Public reviews must enter `PENDING` state first.

Only approved reviews appear publicly.

Admin moderation must write audit logs.

---

## 6. Order Lifecycle

Use these order statuses:

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

Use these payment statuses:

```txt
UNPAID
PROOF_SENT_ON_WHATSAPP
UNDER_REVIEW
CONFIRMED
REJECTED
```

Every order status change must create an `order_status_events` record.

Every payment confirmation/rejection must create a payment confirmation event and an audit log.

Do not allow invalid transitions. Example: a cancelled order must not move to delivered without a deliberate super_admin override.

---

## 7. Roles and Permissions

Roles:

```txt
CUSTOMER
MODERATOR
SUPER_ADMIN
```

### super_admin

Can:

- Manage admins.
- Manage products/categories/variants/images.
- Manage delivery zones and surcharge rules.
- Manage payment settings.
- Manage email settings/templates.
- Manage orders and reviews.
- View dashboard and audit logs.

### moderator

Can:

- View dashboard.
- Manage order lifecycle within allowed transitions.
- Confirm or reject payment proof if approved by product policy.
- Update product availability.
- Moderate reviews.

Cannot:

- Change Moniepoint/payment settings.
- Change email sender/settings.
- Create or remove admins.
- Delete critical records.
- Override protected business rules.

### customer

Can:

- Browse menu.
- Checkout.
- View own orders if authenticated.
- Submit reviews.
- Manage basic profile details.

Admin permissions must be enforced server-side, not only hidden in the UI.

---

## 8. Public Frontend Experience Rules

The frontend is mobile-first because the majority of users are mobile users.

Every public page must be:

- Fast.
- Clear.
- Predictable.
- Accessible.
- Light-mode excellent.
- Dark-mode usable from day one.
- Touch-friendly.
- Not bloated.

Users must always understand:

```txt
Where am I?
What can I do here?
What will happen if I tap this?
How much am I paying?
What is delivery costing?
What happens after checkout?
What is my order status?
```

No hidden fees. No vague CTAs. No confusing payment language. No surprise login requirement.

---

## 9. UI and Design System Rules

Sunflour UI should feel warm, fresh, professional, and controlled.

Default mode is light mode. Dark mode must follow the user's system preference and remain comfortable.

### Core tokens

```css
:root {
  --color-brand-red: #B22416;
  --color-brand-red-strong: #8F1C12;
  --color-brand-yellow: #FFD400;
  --color-brand-yellow-soft: #FFF3B0;
  --color-cream: #FFF8EC;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F8F3EA;
  --color-text: #24150D;
  --color-text-muted: #6F4B33;
  --color-border: #E9DCC8;
  --color-success: #128C4A;
  --color-warning: #B7791F;
  --color-danger: #B42318;
  --color-info: #2563EB;
}

.dark {
  --color-brand-red: #FF6B5A;
  --color-brand-red-strong: #FF8A7B;
  --color-brand-yellow: #FFD84D;
  --color-brand-yellow-soft: #3A2F10;
  --color-cream: #18120C;
  --color-surface: #211812;
  --color-surface-muted: #2C2119;
  --color-text: #FFF7ED;
  --color-text-muted: #D8C3AE;
  --color-border: #49362B;
  --color-success: #4ADE80;
  --color-warning: #FACC15;
  --color-danger: #FB7185;
  --color-info: #93C5FD;
}
```

### Typography

Use `Inter`, `Manrope`, or a similarly clean UI font. Do not use decorative fonts for app UI.

### Component rules

Build reusable app-specific components, not a bloated generic component library.

Required primitives:

```txt
Button
Input
Textarea
Select
Checkbox
Radio
Badge
Card
Modal/Drawer
Sheet
Tabs
Toast
Skeleton
EmptyState
StatusPill
PriceText
QuantityStepper
```

Required business components:

```txt
ProductCard
ProductDetailSheet
CategoryFilter
SearchBar
CartSummary
DeliveryQuoteCard
CheckoutStepper
PaymentInstructionCard
InvoiceSummary
OrderStatusTimeline
ReviewCard
AdminMetricCard
AdminDataTable
AdminStatusSelect
AdminUploadField
```

---

## 10. Accessibility Standard

Target WCAG 2.2 AA.

Minimum rules:

- Text contrast must be readable in light and dark mode.
- Buttons and links must have visible focus states.
- Tap targets should be comfortable on mobile.
- Forms must have labels and useful errors.
- Status must not rely on color alone.
- Modals/drawers must trap focus where appropriate.
- Loading states must not hide important user context.
- Error messages must tell users what to do next.
- Use semantic HTML before custom widgets.

Do not ship inaccessible checkout or admin controls.

---

## 11. Performance Standard

Performance is part of trust.

Use:

- Server Components for mostly static/server-rendered views.
- Client Components only where interaction requires them.
- Image optimization.
- Suspense/loading states.
- Small client bundles.
- Route-level code splitting.
- Optimistic UI only when rollback is safe.

Avoid:

- Making the whole app `use client`.
- Heavy UI libraries without approval.
- Unnecessary animation packages.
- Loading all admin code on public pages.
- Client-side calculation of trusted business totals.

---

## 12. Backend API Rules

API routes should follow this shape:

```txt
/api/v1/public/*
/api/v1/customer/*
/api/v1/admin/*
/api/v1/webhooks/*
```

API responses should be predictable:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};
```

Never expose secrets, internal stack traces, or unsafe database details in API responses.

---

## 13. Admin Dashboard Metrics

Dashboard must support:

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

Dashboard data must come from backend queries, not frontend guesses.

Sales estimate should be conservative:

```txt
SUM(total) WHERE payment_status = CONFIRMED AND status != CANCELLED AND status != REJECTED
```

Label it as estimate because payment is manually verified.

---

## 14. Security Rules

Non-negotiables:

- Validate every request with Zod.
- Use TypeScript strict mode.
- Enforce RBAC server-side.
- Store secrets only in environment variables.
- Do not commit `.env` files.
- Do not expose payment settings to public APIs except what is needed after checkout.
- Use signed upload flow for Cloudflare R2.
- Validate file type, size, and upload intent.
- Rate-limit sensitive public endpoints.
- Add audit logs for admin-critical actions.
- Use idempotency for checkout/order creation.
- Never trust frontend totals.

Critical actions requiring audit logs:

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

## 15. Testing Requirements

Every meaningful feature must include tests or a clear reason why not.

Use `pnpm` commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Recommended test layers:

```txt
Unit tests: money, delivery fee, surcharge, status transitions, validation.
Integration tests: API routes, database writes, auth/RBAC, checkout, email outbox.
Component tests: forms, product cards, checkout steps, admin controls.
E2E tests: menu -> cart -> checkout -> invoice -> admin order update.
Accessibility tests: checkout, menu, admin forms, modal/drawer interactions.
```

Do not mark a phase done if `pnpm build` fails.

---

## 16. Vercel and Deployment Rules

Vercel is part of the engineering workflow.

Expected flow:

```txt
Feature branch -> Pull Request -> Vercel Preview Deployment -> checks -> review -> merge -> Production
```

Rules:

- No direct production edits.
- No secrets in GitHub.
- Preview and Production env vars must be separate.
- Test checkout/admin/email behaviour on Preview before Production.
- Use Vercel Environment Variables for secrets.
- Use Vercel Cron only for approved scheduled jobs like email outbox processing.
- Check current Next.js and Vercel docs when implementing runtime/deployment behaviour.

---

## 17. AI Agent Workflow

Every AI agent task must be scoped.

Use this task packet:

```txt
Task:
Implement Phase X: [name].

Read first:
- AGENTS.md
- docs/backend-implementation.md
- docs/frontend-implimentation.md
- relevant API/schema/design docs

Scope:
- Only implement files needed for this phase.
- Do not redesign unrelated modules.
- Do not change product rules without approval.
- Use pnpm only.

Acceptance criteria:
- [paste exact acceptance criteria]

Required checks:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build

Output expected:
- Summary of changed files.
- Tests added or updated.
- Risks, assumptions, and unresolved questions.
```

Agents must not perform wide refactors unless the task explicitly requests it.

---

## 18. Implementation Order

Follow this order unless the human maintainer changes it:

```txt
1. Product rule confirmation.
2. Repository foundation and pnpm setup.
3. Database schema.
4. Auth and RBAC.
5. Design system and frontend shell.
6. Menu/product backend.
7. Public menu frontend.
8. Delivery fee and surcharge engine.
9. Cart and checkout UI.
10. Checkout/order creation backend.
11. Manual payment workflow.
12. Invoice backend and frontend.
13. Resend email outbox.
14. Admin dashboard shell.
15. Admin order lifecycle.
16. Product/category/media admin.
17. Delivery/payment/email/review admin controls.
18. Customer profile and guest lookup.
19. Reviews moderation.
20. Dashboard metrics.
21. Hardening, accessibility, performance, and launch testing.
```

Each phase must accomplish something usable. Do not build disconnected abstractions that do not move the product forward.

---

## 19. Definition of Done

A feature is not done until:

```txt
1. It matches the implementation plan.
2. It uses pnpm scripts successfully.
3. Types pass.
4. Lint passes.
5. Relevant tests pass.
6. Build passes.
7. Security rules are respected.
8. Accessibility is considered where UI exists.
9. Error and empty states exist.
10. Mobile experience works.
11. Admin-critical actions are audited.
12. Frontend does not guess backend-trusted values.
13. The code is clear enough for another engineer or AI agent to maintain.
```

---

## 20. Anti-Patterns to Reject

Reject code that:

- Uses `npm`, `yarn`, or `bun` instead of `pnpm`.
- Makes the whole app a Client Component.
- Places all business logic inside route handlers.
- Trusts frontend prices, delivery fees, or totals.
- Hardcodes delivery zones or product prices.
- Sends Resend emails directly outside the email module.
- Allows moderators to change payment settings.
- Updates order status without `order_status_events`.
- Updates critical admin data without `audit_logs`.
- Shows unapproved reviews publicly.
- Makes checkout depend on email being available.
- Adds dependencies without clear product value.
- Ignores dark mode.
- Ignores mobile usability.
- Creates beautiful UI on weak business logic.
- Ships without `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

---

## 21. What Good Looks Like

Use these systems as quality references, not as copy targets:

```txt
Vercel Commerce:
Fast Next.js commerce structure, server-first product browsing, clean deployment discipline.

Vercel Platform:
Preview Deployments, environment separation, GitHub workflow, production discipline.

Stripe Checkout:
Clear payment state, no surprise payment flow, confidence-building transaction experience.

Shopify Admin:
Clear order/payment/fulfillment separation and practical merchant operations.

Toast:
Restaurant-aware ordering, guest checkout, pricing before order finalization.

Square Orders:
Disciplined order object, line items, service charges, fulfillment, and payment association.

Apple HIG:
Clarity, deference, depth, touch quality, predictable interface behaviour.

Material Design:
Reusable component system, state clarity, accessibility, and motion discipline.

GOV.UK Design System:
Plain language, form clarity, error quality, accessibility-first public service UX.

Resend:
Controlled transactional email infrastructure.

OWASP:
Security by default, especially validation, uploads, auth, and auditability.
```

Sunflour should feel easy because the system underneath is disciplined.

---

## 22. Final Rule

When uncertain, optimize for:

```txt
Customer clarity.
Business trust.
Security.
Mobile speed.
Operational simplicity.
Maintainable architecture.
```

This platform is not built for decoration. It is built to help Sunflour operate better.

**Built for honour and for excellence.**
