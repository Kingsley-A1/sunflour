# CLAUDE.md - Sunflour Bakery

Claude Code must treat `AGENTS.md` as the source of truth for this repository. If this file conflicts with `AGENTS.md`, follow `AGENTS.md` and flag the conflict in the final response.

## Read First

Before editing code or docs, read:

```txt
AGENTS.md
backend-implementation.md
frontend-implimentation.md
relevant skills for the task 
```

If implementation documents later move into `docs/`, read the `docs/` copies instead.

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

If a required document is missing, create a narrow placeholder only when the task calls for it. Do not invent business rules.

## Operating Rules

- Use `pnpm` only.
- Keep route handlers thin; put business logic in `src/server/modules/*`.
- Never trust frontend prices, subtotals, delivery fees, surcharge values, or totals.
- Recalculate order totals on the backend.
- Snapshot product, delivery, and payment data on every order.
- Keep manual Moniepoint payment honest: payment is not confirmed until an admin verifies it.
- Use the email module only for transactional email.
- Enforce RBAC server-side.
- Write audit logs for admin-critical actions.
- Write `order_status_events` for every order status change.
- Keep public UI mobile-first, accessible, light-mode excellent, and dark-mode usable.
- Do not add dependencies without clear product value.
- Do not perform wide refactors unless explicitly requested.

## Task Packet

Use this format for Claude Code tasks:

```txt
Task:
Implement Phase X: [name].

Read first:
- AGENTS.md
- backend-implementation.md
- frontend-implimentation.md
- relevant docs/*

Scope:
- Only implement files needed for this phase.
- Do not redesign unrelated modules.
- Do not change product rules without approval.
- Use pnpm only.

Acceptance criteria:
- [paste exact criteria]

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

## Claude-Specific Guardrails

- Prefer small vertical slices over broad scaffolding.
- State assumptions before coding when product decisions are missing.
- Leave exact TODOs for business decisions that require the maintainer.
- Explain architecture decisions briefly in the final response.
- Never commit secrets, `.env` files, lockfiles from other package managers, or generated clutter.
