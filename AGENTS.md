# AGENTS.md - Sunflour Bakery

Project: Sunflour Bakery ordering platform.
Standard: built for honour and for excellence.
Package manager: `pnpm` only.

This file is the compact operating contract for AI agents. Use the section that matches the current task, then read the linked project docs only when that task needs them. Do not treat this file as permission for broad refactors.

---

## 1. Mission

Sunflour is a mobile-first bakery ordering platform, not a generic restaurant site.

Customers must be able to browse the official menu, search products, add items to cart, choose pickup or delivery, see delivery fees before checkout, receive Moniepoint bank-transfer instructions, view invoices, send payment proof through WhatsApp, track order status where supported, and submit moderated reviews.

Admins must be able to manage products, categories, variants, images, delivery zones, surcharge rules, manual payment settings, payment verification, order lifecycle, reviews, dashboard metrics, transactional email behavior, audit logs, business settings, and reference menu content.

When uncertain, optimize for customer clarity, business trust, security, mobile speed, operational simplicity, and maintainable architecture.

---

## 2. Read What Applies

Always read:

- `AGENTS.md`
- The user request
- Existing code in the files or modules you will touch

For planning or product-rule work, also read:

- `backend-implementation.md`
- `frontend-implimentation.md`
- Relevant `*-2.0.md` docs when the task references them

For backend, API, database, checkout, orders, auth, payments, email, reviews, audit, or delivery work, also read:

- `docs/api-contracts.md`
- `docs/database-schema.md`
- `docs/order-lifecycle.md`

For frontend, UI, design-system, layout, accessibility, public, customer, or admin UI work, also read:

- `docs/design-system.md`
- `docs/frontend-routes.md`
- `docs/component-contracts.md`

If a required doc is missing, check the repo root before asking. Do not invent business rules. If a rule is absent and materially affects behavior, stop and report the exact decision needed.

---

## 3. Stack And Boundaries

Stack:

- Next.js 16 App Router, React 19, TypeScript strict mode
- Tailwind CSS and CSS variables
- CockroachDB with Prisma
- Auth.js / NextAuth
- Resend and React Email templates
- Cloudflare R2 for media
- Zod validation
- Vitest, React Testing Library, Playwright, axe checks where relevant
- Vercel hosting and GitHub based deployment

Architecture:

- Modular monolith inside Next.js App Router.
- Route handlers stay thin: validate request, call service/module, return typed response.
- Business logic belongs in `src/server/modules/*`.
- UI logic belongs in components, hooks, or route-level composition.
- Database access must be isolated behind services/modules.
- Do not turn whole route groups or the whole app into Client Components.
- Do not add dependencies unless the product value is clear and the existing stack cannot reasonably handle the task.

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

Do not generate `package-lock.json`, `yarn.lock`, or `bun.lockb`.

---

## 4. Product Rules

Money and pricing:

- Never trust frontend prices, delivery fees, surcharge values, subtotals, or totals.
- Backend must recalculate product price, variant price, quantity, subtotal, delivery base fee, 6 PM surcharge, final delivery fee, and order total.
- Orders must store snapshots for product name, variant name, unit price, line total, delivery zone name, delivery base fee, surcharge, delivery total fee, payment instruction, and proof WhatsApp number.
- Old invoices must not change when products, prices, delivery zones, surcharge rules, or payment settings change later.

Delivery:

- Delivery zones are admin-editable.
- From 6:00 PM, delivery orders receive an additional NGN 500 surcharge unless the active rule is disabled by an authorized admin.
- Pickup has NGN 0 delivery fee and never receives the delivery surcharge.

Manual payment:

- Sunflour uses manual Moniepoint bank transfer in v1.
- The system must never claim payment is confirmed until an admin verifies it.
- Correct flow: order created, invoice generated, payment instruction shown, WhatsApp proof handoff, admin verifies, payment confirmed, order progresses.

Orders:

- Order statuses: `PENDING_PAYMENT`, `PAYMENT_UNDER_REVIEW`, `PAYMENT_CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REJECTED`.
- Payment statuses: `UNPAID`, `PROOF_SENT_ON_WHATSAPP`, `UNDER_REVIEW`, `CONFIRMED`, `REJECTED`.
- Every order status change creates an `order_status_events` record.
- Payment confirmation or rejection creates payment confirmation events and audit logs.
- Invalid transitions must be rejected server-side.

Email:

- All email goes through the email module.
- Approved email use cases: `ORDER_CONFIRMATION`, `PURCHASE_INVOICE`, `AUTH_PASSWORD_RESET`, `ADMIN_NEW_ORDER_ALERT`, `ORDER_STATUS_UPDATE`, `APPRECIATION_AFTER_DELIVERY`.
- Do not send marketing, newsletters, birthday offers, or promotional automation without explicit approval.
- Do not call Resend directly outside the email module.
- Email failure must not break order creation.

Reviews:

- Public reviews enter `PENDING`.
- Only approved reviews appear publicly.
- Admin moderation writes audit logs.

---

## 5. Roles, RBAC, And Audit

Roles:

- `CUSTOMER`
- `ATTENDANT`
- `MEDIA_MANAGER`
- `MODERATOR`
- `SUPER_ADMIN`

Server-side RBAC is the authority. Hidden UI is not security.

General permissions:

- `SUPER_ADMIN`: all admin operations, including admins, products, categories, variants, images, delivery, payment, email, orders, reviews, dashboard, settings, and audit logs.
- `MODERATOR`: operational order lifecycle, payment review where policy allows, product availability, dashboard, and review moderation.
- `ATTENDANT`: order operations only where allowed by backend role groups.
- `MEDIA_MANAGER`: product/media/content surfaces where allowed; no payment settings, admin management, or order authority unless explicitly granted.
- `CUSTOMER`: public browsing, checkout, own account/orders, and review submission.

Critical admin actions require audit logs, including payment settings, delivery fee updates, surcharge rules, product price/status changes, order payment confirmation/rejection, cancellation/rejection, admin creation/removal, email template changes, review moderation, business settings, and content settings.

---

## 6. Frontend And UX

Public frontend must be fast, mobile-first, predictable, accessible, and honest about price and payment state.

Users should always understand:

- Where they are
- What they can do
- What happens after tapping a control
- How much they are paying
- What delivery costs
- What happens after checkout
- Current order/payment status

Design-system rules:

- Use semantic tokens from the design system; avoid raw one-off colors.
- Light mode must be excellent. Dark mode must remain comfortable.
- Use app-specific reusable components instead of a bloated generic library.
- Build on existing primitives before creating new ones.
- Keep components touch-friendly, keyboard usable, and readable at 360px width.
- Status must use text, not color alone.
- Forms need labels, useful help text, field errors, and clear recovery.
- Modals/sheets must be labelled and manage focus.
- Motion must respect `prefers-reduced-motion` and never block interaction.

Performance rules:

- Prefer Server Components for static or server-rendered views.
- Use Client Components only where interaction requires them.
- Avoid loading admin code on public pages.
- Avoid heavy animation/UI libraries unless explicitly approved.
- Use image optimization, route-level splitting, and stable loading states.

---

## 7. Backend, API, And Data

API namespaces:

```txt
/api/v1/public/*
/api/v1/customer/*
/api/v1/admin/*
/api/v1/webhooks/*
```

Response envelope:

```ts
type ApiSuccess<T> = { ok: true; data: T };
type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};
```

Backend rules:

- Validate every request with Zod.
- Normalize API errors; never expose stack traces, secrets, raw Prisma errors, or unsafe internals.
- Use idempotency for checkout and other duplicate-sensitive writes.
- Use transactions where multiple records must stay consistent.
- Keep trusted totals on the server.
- Store money as integer minor units.
- Store timestamps in UTC and apply the configured app timezone at business-rule boundaries.
- Use signed upload flows for Cloudflare R2 and verify file type, size, purpose, and object existence.
- Public APIs must expose only what the user journey needs.

---

## 8. Security

Non-negotiables:

- TypeScript strict mode.
- Zod validation at trust boundaries.
- Server-side RBAC.
- Secrets only in environment variables.
- No `.env` commits.
- No sensitive payment settings in public APIs except checkout-required snapshots/instructions.
- Rate-limit sensitive public endpoints.
- Audit critical admin mutations.
- Do not trust frontend totals, statuses, roles, or ownership.
- Customer data access must enforce ownership server-side.

---

## 9. Testing And Definition Of Done

Use checks in proportion to risk. For meaningful code changes, run the relevant subset and explain any skipped check.

Required before marking a feature done when feasible:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Test focus:

- Unit: money, delivery surcharge, status transitions, validation, pure services.
- Integration: API routes, database writes, auth/RBAC, checkout, email outbox, audit behavior.
- Component: forms, product cards, checkout/admin controls, modals/sheets.
- E2E/accessibility: menu, cart, checkout, invoice, admin order updates, critical forms.

Done means:

- Matches the requested scope and product rules.
- Types, lint, tests, and build pass or any skipped item is justified.
- Security rules are respected.
- Accessibility is considered where UI exists.
- Loading, empty, error, and success states are handled.
- Mobile experience works.
- Critical admin actions are audited.
- Frontend does not guess backend-trusted values.
- Code is maintainable by another engineer or agent.

---

## 10. Agent Workflow

Before editing:

- Identify the task type: frontend, backend, auth/RBAC, database, docs, tests, deployment, or mixed.
- Read only the relevant docs from Section 2.
- Inspect actual code before changing names, contracts, schema, tokens, or behavior.
- Preserve unrelated worktree changes.

While editing:

- Keep changes scoped.
- Prefer existing local patterns and helpers.
- Do not mass-refactor unless explicitly asked.
- Do not change business rules without approval.
- Do not create disconnected abstractions.
- Use `apply_patch` for manual file edits.

When reporting:

- List files changed.
- State decisions made.
- State validation results.
- Call out risks, assumptions, or unresolved product decisions.

Task packet for new agents:

```txt
Task:
[specific implementation goal]

Read first:
- AGENTS.md
- [only relevant docs from Section 2]

Scope:
- [files/modules in scope]
- No unrelated redesign/refactor
- Preserve product rules
- Use pnpm only

Acceptance:
- [clear criteria]

Required checks:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
```

---

## 11. Reject These Patterns

Reject code that:

- Uses `npm`, `yarn`, or `bun`.
- Makes the whole app client-rendered.
- Puts business logic inside route handlers.
- Trusts frontend prices, fees, totals, roles, ownership, or statuses.
- Hardcodes editable delivery zones or product prices.
- Sends email outside the email module.
- Allows unauthorized roles to change payment, email, admin, or protected business settings.
- Updates order/payment status without required events and audit logs.
- Shows unapproved reviews publicly.
- Makes checkout depend on email availability.
- Adds dependencies without clear product value.
- Ignores mobile usability, accessibility, dark mode, or production build health.
- Ships beautiful UI on weak business logic.

---

## 12. Final Rule

This platform is built to help Sunflour operate better. Favor disciplined systems over decoration, clear user journeys over clever UI, and production-safe implementation over quick patches.
