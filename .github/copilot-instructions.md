# GitHub Copilot Instructions - Sunflour Bakery

Follow `AGENTS.md` as the repository source of truth. These instructions are a shorter Copilot-facing summary for chat, inline completions, and agent work.

## Project Context

Sunflour Bakery is a mobile-first restaurant ordering platform, not a generic marketing site. The system must support menu browsing, cart, delivery or pickup, delivery fees with the 6 PM surcharge, manual Moniepoint transfer instructions, invoice access, WhatsApp payment proof handoff, order tracking, reviews, and admin operations.

The stack is Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS, Prisma, CockroachDB, Auth.js, Resend, Cloudflare R2, Zod, Vercel, Vitest, React Testing Library, Playwright, and axe checks where relevant.

Use `pnpm` only.

## Required Reading

Before meaningful changes, read:

```txt
AGENTS.md
backend-implementation.md
frontend-implimentation.md
```

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

## Architecture Rules

- Use a modular monolith inside Next.js App Router.
- Keep route handlers thin: validate request, call service/module, return typed response.
- Put business logic in `src/server/modules/*`.
- Put shared backend utilities in `src/server/lib/*`.
- Put reusable UI in `src/components/*`.
- Avoid making the whole app a Client Component.
- Prefer Server Components for mostly static or server-rendered views.

## Product Rules

- Never trust prices, delivery fees, surcharge values, or totals from the frontend.
- Backend must recalculate product price, variant price, quantity, subtotal, delivery fee, 6 PM surcharge, and final total.
- Delivery from 6:00 PM receives a NGN 500 surcharge unless disabled by an authorized admin.
- Pickup has NGN 0 delivery fee and no 6 PM surcharge.
- Every order must store product, variant, price, delivery, and payment instruction snapshots.
- Manual Moniepoint payment is not confirmed until an admin verifies it.
- Public reviews start as `PENDING`; only approved reviews appear publicly.

## Security Rules

- Validate every request with Zod.
- Enforce RBAC server-side.
- Store secrets only in environment variables.
- Do not expose internal stack traces or unsafe database details.
- Use signed upload flow for Cloudflare R2.
- Rate-limit sensitive public endpoints.
- Add audit logs for admin-critical mutations.
- Use idempotency for checkout/order creation.

## UI Rules

- Mobile-first.
- Accessible to WCAG 2.2 AA target.
- Use design tokens, not random colors.
- Make checkout and payment language clear.
- Show delivery base fee, surcharge, and total before checkout.
- Do not show payment as confirmed until the backend says it is confirmed.
- Admin UI should be operational and restrained.

## Required Checks

For meaningful implementation work, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If a check cannot run because the project foundation does not exist yet, state that clearly.
