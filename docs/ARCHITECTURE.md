# Sunflour Bakery — Architecture (Developer Single Source of Truth)

> This is the canonical technical reference for engineers working on the Sunflour
> Bakery ordering platform. Read this together with [`AGENTS.md`](../AGENTS.md)
> (the operating contract) before making changes. When this document and the code
> disagree, fix one of them — do not leave them out of sync.

Last reviewed: 2026-06-28.

---

## 1. What this platform is

A mobile-first bakery ordering platform for Sunflour Bakery (Calabar, Nigeria).
Customers browse the menu, build a cart, choose pickup or delivery, receive a
Moniepoint bank-transfer instruction, send payment proof on WhatsApp, and view an
invoice. Staff confirm payment manually, move orders through their lifecycle, and
manage catalog, delivery, reviews, settings, and content from an admin panel.

It is **not** a generic restaurant template. Trust, honest payment state, mobile
speed, and operational discipline take priority over decoration.

---

## 2. Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS-variable design tokens |
| Database | CockroachDB via Prisma (client generated to `src/generated/prisma`) |
| Auth | Auth.js / NextAuth (JWT sessions, credentials provider) |
| Email | Resend + React Email templates (through the email module only) |
| Media | Cloudflare R2 (signed uploads) |
| Validation | Zod at every trust boundary |
| Testing | Vitest, React Testing Library, Playwright, axe |
| Hosting | Vercel; GitHub-based deploys |
| Package manager | **pnpm only** |

---

## 3. High-level architecture

A **modular monolith** inside the Next.js App Router.

```
Browser (RSC + Client islands)
        │
        ▼
Next.js App Router
  app/(public)      public customer journey (Server Components first)
  app/(admin)       admin panel (RBAC-gated)
  app/api/v1/*      route handlers (thin)
        │  validate (Zod) → call module → typed response
        ▼
src/server/modules/*   business logic (the only place rules live)
        │
        ▼
src/server/db/prisma    Prisma client  →  CockroachDB
```

Rules of the layering:

- **Route handlers are thin.** They validate the request, call a module/service,
  and return the response envelope. No business logic in handlers.
- **Business logic lives in `src/server/modules/*`.** Database access is isolated
  behind these services — components and handlers never call Prisma directly for
  domain logic.
- **UI logic** lives in components, hooks, and route-level composition. Prefer
  Server Components; use Client Components only where interaction requires them.
- Do **not** turn whole route groups into Client Components, and do not add
  dependencies the existing stack can already cover.

---

## 4. Directory map

```
src/
  app/
    (public)/            customer-facing pages (home, menu, product, cart,
                         checkout, invoice, reviews, about, contact, auth, legal)
    (admin)/             admin shell + pages (orders, products, categories,
                         delivery, payment, email, reviews, users, settings, audit)
    api/v1/
      public/*           unauthenticated journey endpoints
      customer/*         authenticated customer endpoints (ownership enforced)
      admin/*            RBAC-gated admin endpoints
      webhooks/cron/*    scheduled jobs (email outbox)
    sitemap.ts robots.ts opengraph-image.tsx twitter-image.tsx   SEO routes
    layout.tsx           root metadata + providers
  components/
    layout/              shells, header/footer, PageHero, FABs
    commerce/            menu browser, tabular menu, product cards, search bar
    ui/                  design-system primitives (dialog, sheet, tabs, toast…)
    seo/                 JsonLd
  features/cart/         cart store (client)
  server/
    auth/                NextAuth, RBAC, registration, admin codes, password
    config/              env schema, public contact config
    db/                  Prisma client
    modules/             orders, payments, email, menu, delivery, reviews,
                         audit, dashboard, media, settings …
    lib/errors/          AppError + error codes
  lib/                   shared client/server helpers, SEO helpers, hooks
  generated/prisma/      generated Prisma client (do not edit)
  proxy.ts               edge gate for /admin (Next 16 "proxy", formerly middleware)
packages/design-tokens/  tokens.css, themes.css, motion.css (the design source)
prisma/                  schema.prisma + migrations
docs/                    this folder
```

---

## 5. API contract

Namespaces:

```
/api/v1/public/*     no auth required (menu, products, checkout, reviews, lookup)
/api/v1/customer/*   authenticated customer (own orders/profile; ownership enforced)
/api/v1/admin/*      authenticated admin (RBAC by role)
/api/v1/webhooks/*   machine-to-machine (cron secret)
```

Response envelope (always):

```ts
type ApiSuccess<T> = { ok: true; data: T };
type ApiError = {
  ok: false;
  error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
};
```

Conventions:

- Validate every request body/query/params with **Zod**.
- Normalize errors via `AppError` (`src/server/lib/errors`). Never leak stack
  traces, secrets, or raw Prisma errors.
- Use **idempotency** for checkout and other duplicate-sensitive writes.
- Use **transactions** when multiple records must stay consistent.
- Money is stored and computed as **integer minor units (kobo)**.
- Timestamps are **UTC**; apply the app timezone at business-rule boundaries.

See [`api-contracts.md`](./api-contracts.md) for the per-endpoint detail.

---

## 6. Core domains

### 6.1 Pricing & checkout (trust boundary)
The backend **recalculates everything** — product/variant price, quantity,
subtotal, delivery base fee, the 6 PM surcharge, final delivery fee, and order
total. Frontend values are never trusted. The tabular menu is a **reference
surface only**; checkout always uses live catalog data.

### 6.2 Orders & payments
- Order statuses: `PENDING_PAYMENT`, `PAYMENT_UNDER_REVIEW`, `PAYMENT_CONFIRMED`,
  `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`,
  `REJECTED`.
- Payment statuses: `UNPAID`, `PROOF_SENT_ON_WHATSAPP`, `UNDER_REVIEW`,
  `CONFIRMED`, `REJECTED`.
- Every status change writes an `order_status_events` row; payment
  confirmation/rejection writes payment events + audit logs.
- Invalid transitions are rejected **server-side**.
- The system **never** claims payment is confirmed until an admin verifies it.
- Orders store **snapshots** (product/variant name, unit price, line total,
  delivery zone name, base fee, surcharge, delivery total, payment instruction,
  proof WhatsApp number) so historical invoices never change when settings do.
- Logic: [`src/server/modules/orders`](../src/server/modules/orders),
  [`src/server/modules/payments`](../src/server/modules/payments). Lifecycle
  detail: [`order-lifecycle.md`](./order-lifecycle.md).

### 6.3 Delivery
Admin-editable zones; pickup is always ₦0 and never surcharged. Delivery orders
from 6:00 PM get a +₦500 surcharge unless an authorized admin disables the active
rule.

### 6.4 Email (outbox pattern)
All email goes through `src/server/modules/email`. Nothing sends inline:

```
queueEmail()  →  EmailOutbox row (QUEUED|SKIPPED)
processEmailOutbox()  ← called by POST /api/v1/webhooks/cron/email-outbox
  → sendEmailWithResend()  (only if EMAIL_SENDING_ENABLED + keys configured)
```

- Approved templates: `ORDER_CONFIRMATION`, `PURCHASE_INVOICE`,
  `AUTH_PASSWORD_RESET`, `ADMIN_NEW_ORDER_ALERT`, `ORDER_STATUS_UPDATE`,
  `APPRECIATION_AFTER_DELIVERY`. No marketing without explicit approval.
- Email failure must **never** break order/payment writes — callers queue
  best-effort (try/catch).
- The outbox is driven by an external scheduler:
  [`.github/workflows/email-outbox-cron.yml`](../.github/workflows/email-outbox-cron.yml)
  POSTs the endpoint every ~5 min with the `x-cron-secret` header.
- Status-update emails are queued **without an `orderId`** so the
  `@@unique([orderId, templateKey, recipientEmail])` constraint does not collapse
  multiple transitions into one message.

### 6.5 Reviews
Public reviews enter `PENDING`; only approved reviews render publicly. Submitted
content is sanitized (no stored HTML). Moderation writes audit logs.

### 6.6 Media
Signed R2 upload flow; verify file type, size, purpose, and object existence.

---

## 7. Auth, RBAC & admin onboarding

Roles: `CUSTOMER`, `ATTENDANT`, `MEDIA_MANAGER`, `MODERATOR`, `SUPER_ADMIN`.

- **Server-side RBAC is the only authority.** Hidden UI is not security.
- [`src/proxy.ts`](../src/proxy.ts) is the edge gate: it redirects clearly
  unauthenticated visitors away from `/admin` to sign-in, and clearly non-admin
  customers home. Fine-grained role/status checks still run server-side
  (`requireRole`) — the proxy is defense-in-depth, not the decision point.
- Sessions are JWT (NextAuth). Login lockout after repeated failures
  (`src/server/auth/registration-service.ts`).

### Admin registration codes
New admins self-register at `/admin-register` with a role-specific code. Codes are
**derived, never stored**:

```
code = HMAC_SHA256(ADMIN_REGISTRATION_CODE_SECRET, role + weekWindow + nonce) mod 1e6
```

- One env var: `ADMIN_REGISTRATION_CODE_SECRET` (≥32 chars, required in prod).
- Codes **auto-rotate weekly** (window = `floor(now / 7 days)`).
- A SUPER_ADMIN can force-rotate (changes the `nonce` stored in `SiteSetting`
  `admin_registration_code_rotation`) — audit-logged.
- Read current codes: Admin → Users, or
  `pnpm tsx scripts/print-admin-registration-codes.ts`.
- Recovery: if the secret is lost, set a new one in Vercel and redeploy — codes
  are deterministic outputs of whatever secret is currently set, so new codes work
  immediately (old ones stop working). With the new secret you can register a
  fresh SUPER_ADMIN and regain access. **Back up `ADMIN_REGISTRATION_CODE_SECRET`
  and `DATABASE_URL` offline** — together they are the recovery key.

Critical admin mutations are **audited** (`src/server/modules/audit`): payment
settings, delivery/surcharge changes, product price/status, order
confirmation/rejection, cancellation/rejection, admin create/remove, email
template changes, review moderation, business/content settings.

---

## 8. Design system

The visual source of truth is [`packages/design-tokens`](../packages/design-tokens):

- `tokens.css` — raw primitives (never consumed directly in components).
- `themes.css` — semantic tokens (`--color-*`, shadows, **brand gradients**), with
  a tuned dark-mode block.
- `motion.css` — keyframes + motion utilities; all animation respects
  `prefers-reduced-motion`.
- `src/styles/component-contracts.css` — base element styles, typography classes,
  and shared surfaces: `.sf-hero-surface`, `.sf-surface-gradient`,
  `.sf-text-gradient`.

Component rules:

- Consume **semantic tokens** (`var(--color-…)`); avoid raw one-off colors.
- Build on existing primitives in `components/ui/*` before adding new ones.
- Public heroes use [`PageHero`](../src/components/layout/page-hero.tsx).
- Touch-friendly, keyboard-usable, readable at 360px; status uses text not color
  alone; modals/sheets manage focus (`useModalFocus`).

See [`design-system.md`](./design-system.md) and
[`component-contracts.md`](./component-contracts.md).

---

## 9. SEO

- `NEXT_PUBLIC_APP_URL` drives `metadataBase`, canonicals, `sitemap.xml`,
  `robots.txt`. In production it must equal the apex domain.
- [`sitemap.ts`](../src/app/sitemap.ts) is dynamic and includes every public
  product URL; [`robots.ts`](../src/app/robots.ts) disallows admin/api/checkout.
- Structured data via [`JsonLd`](../src/components/seo/json-ld.tsx) +
  [`structured-data.ts`](../src/lib/seo/structured-data.ts) (`Bakery` on home,
  `Product` on product pages).
- Social images generated by `opengraph-image.tsx` / `twitter-image.tsx`.
- Per-product metadata via `generateMetadata` on `/products/[slug]`.

---

## 10. Configuration & environments

All env is validated in [`src/server/config/env.ts`](../src/server/config/env.ts)
(Zod). Secrets live only in environment variables — never commit `.env`.

Key variables (see the Owner's Guide for the full operational list):

```
DATABASE_URL                      CockroachDB connection
AUTH_SECRET / NEXTAUTH_SECRET     session signing
NEXT_PUBLIC_APP_URL               canonical site URL
ADMIN_REGISTRATION_CODE_SECRET    admin code derivation (≥32 chars)
EMAIL_SENDING_ENABLED             master switch for outbound email
RESEND_API_KEY / EMAIL_FROM_*     Resend sending
EMAIL_CRON_SECRET                 authorizes the outbox cron endpoint
ADMIN_ORDER_ALERT_EMAILS          staff new-order alerts
R2_* (Cloudflare)                 media storage
```

---

## 11. Local development

```bash
pnpm install
pnpm dev          # next dev (Turbopack)
pnpm lint         # eslint --max-warnings=0
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
pnpm build        # prisma generate && next build
```

Database / Prisma:

```bash
pnpm exec prisma migrate status     # what's applied vs pending
pnpm exec prisma migrate dev        # create + apply a migration locally
pnpm exec prisma migrate deploy     # apply pending migrations (prod)
```

Migrations are additive and reviewed before `deploy`. See
[`test-database-strategy.md`](./test-database-strategy.md) and
[`vercel-deployment.md`](./vercel-deployment.md).

---

## 12. Definition of done

A change is done when it: matches scope and product rules; passes lint, typecheck,
tests, and build (or skips are justified); respects security rules (server-side
RBAC, no trusted frontend totals, audited critical mutations); handles loading,
empty, error, and success states; works on mobile and in dark mode; considers
accessibility where there is UI; and is maintainable by the next engineer.

---

## 13. Reject-list (do not ship)

`npm`/`yarn`/`bun`; whole-app client rendering; business logic in route handlers;
trusting frontend prices/fees/totals/roles/ownership; hardcoded delivery
zones/prices; email outside the email module; unauthorized role changes to
payment/email/admin settings; status changes without events + audit logs; showing
unapproved reviews; checkout that depends on email; unnecessary dependencies;
ignoring mobile/accessibility/dark-mode/build health.
