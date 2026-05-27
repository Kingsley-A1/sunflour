# Codex Instructions - Sunflour Bakery

Use `AGENTS.md` as the source of truth. This file is a Codex-specific quickstart so future Codex sessions stay aligned with the product rules, architecture, and quality bar.

## Default Execution Mode

Work in vertical slices. Each task should produce a usable increment, not disconnected scaffolding.

Before code changes, read:

```txt
AGENTS.md
backend-implementation.md
frontend-implimentation.md
```

For backend work, also read:

```txt
docs/api-contracts.md
docs/database-schema.md
docs/order-lifecycle.md
```

For frontend work, also read:

```txt
docs/design-system.md
docs/frontend-routes.md
docs/component-contracts.md
```

If a required document is missing, either ask for the decision or create a narrow placeholder when the task explicitly calls for it.

## Implementation Standard

- Package manager: `pnpm` only.
- Framework: Next.js 16 App Router.
- Runtime: React 19.
- Language: TypeScript strict mode.
- Backend shape: API-first modular monolith.
- Database: CockroachDB through Prisma.
- Auth: Auth.js / NextAuth with server-side RBAC.
- Email: Resend through the email module only.
- Storage: Cloudflare R2 through signed upload flow.
- Validation: Zod for every request.
- Hosting: Vercel with GitHub PR Preview Deployments.

## Non-Negotiable Product Rules

- Frontend totals are never trusted.
- Backend recalculates all money values.
- Product, variant, price, delivery, and payment snapshots are stored on orders.
- Delivery orders from 6:00 PM receive the NGN 500 surcharge unless the active rule is disabled by an authorized admin.
- Pickup has zero delivery fee and no surcharge.
- Manual Moniepoint transfer is pending until admin verification.
- Every order status change writes `order_status_events`.
- Every payment confirmation or rejection writes a payment event and audit log.
- Public reviews require moderation before display.

## Coding Rules

- Keep route handlers thin.
- Put business logic in modules/services.
- Avoid unrelated refactors.
- Do not add dependencies without product value.
- Do not generate `package-lock.json`, `yarn.lock`, or `bun.lockb`.
- Do not commit `.env` files or secrets.
- Preserve user changes in a dirty worktree.
- Prefer focused tests that match the risk of the change.

## Frontend Rules

- Mobile-first.
- Light mode excellent; dark mode usable from day one.
- WCAG 2.2 AA target.
- Use semantic design tokens.
- Show clear loading, empty, error, success, disabled, and focus states.
- Make checkout language plain and payment status honest.
- Do not put backend-trusted business logic in components.

## Required Verification

For implementation work, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If the project is still in planning and these scripts do not exist, report that checks are not runnable yet.

## Final Response Shape

Report:

```txt
Changed files
Verification performed
Risks, assumptions, and unresolved questions
```
