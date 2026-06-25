# Sunflour Bakery Backend Implementation 2.0

**Document:** Backend Implementation 2.0  
**Source review:** `first-backend-review-26-05-27.MD`  
**Purpose:** Production-readiness remediation after Backend Phase 0-13  
**Standard:** Secure, traceable, deployable, and operationally honest  

This document is a phased implementation superset of the first backend review. It does not replace `backend-implementation.md`; it continues it by converting review findings into action-ready engineering phases.

---

## Global Agent Packet

### Role

You are a principal backend engineer hardening Sunflour Bakery's Next.js App Router modular monolith for production launch. You specialize in commerce correctness, restaurant order operations, Prisma/CockroachDB integrity, RBAC, email outbox safety, upload security, and Vercel deployment discipline.

### Intent

Close the production blockers and high-risk findings documented in `first-backend-review-26-05-27.MD` without broad rewrites. Preserve the current architecture while making Phase 0-13 production-verifiable.

### Context

Read first:

```txt
AGENTS.md
backend-implementation.md
docs/api-contracts.md
docs/database-schema.md
docs/order-lifecycle.md
docs/vercel-deployment.md
first-backend-review-26-05-27.MD
```

Current facts:

```txt
- Backend Phase 9-13 implementation has been split into conventional commits on master.
- Local checks previously passed: lint, typecheck, test, coverage, db:validate, build.
- Live CockroachDB migration and Vercel Preview smoke tests still need owner-backed environments.
- Production owner data is still incomplete.
```

### Constraints

```txt
- Use pnpm only.
- Do not commit secrets.
- Do not add production dependencies without approval.
- Do not change the API envelope.
- Do not move business logic into route handlers.
- Do not trust client prices, fees, totals, statuses, or upload metadata.
- Do not mark backend launch complete without remote build and environment proof.
```

### No-goals

```txt
- Do not replace Next.js App Router.
- Do not introduce a separate backend.
- Do not build Paystack/card payment.
- Do not build advanced inventory, coupons, loyalty, SMS, or rider tracking.
- Do not perform frontend redesign in these backend remediation phases.
```

### Required Checks

Run after every meaningful phase:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm db:validate
pnpm build
```

Run when a safe database is available:

```bash
RUN_DB_TESTS=true pnpm test
pnpm db:migrate:deploy
pnpm db:health
```

---

# Phase 14 - Release Integrity and Remote Master Proof

## Goal

Make the repository state clean, auditable, and remotely verifiable.

## Build

- Confirm Phase 9-13 work is committed in conventional commit batches.
- Confirm no secrets or `.env` files are tracked.
- Push `master` only after local checks pass.
- Confirm remote `master` contains the same commits as local `master`.
- Record the commit hashes that represent Phase 9-13.
- Confirm Vercel or CI sees the same remote commit.

## Tests

- `git status --short` is clean before push.
- `git log --oneline -10` shows the expected Phase 9-13 commits.
- `git ls-files .env .env.local` returns nothing.
- Required local checks pass before push.

## Acceptance Criteria

- Local `master` is clean.
- Remote `master` contains all Phase 9-13 commits.
- No secret file is tracked.
- A clean clone or CI run can build the same branch.

## Outcome

The reviewed backend exists on the branch that deployment systems actually use.

## Agent Implementation Prompt

```txt
Role:
You are a release engineer protecting master branch integrity for Sunflour Bakery.

Task:
Verify all Phase 9-13 backend work is committed, local master is clean, no secrets are tracked, and remote master can be updated safely.

Context:
Read first:
- first-backend-review-26-05-27.MD
- backend-implementation.md
- git status and git log output

Constraints:
- Do not commit .env or any secret file.
- Do not squash already-good phase commits without approval.
- Do not push if local checks fail.

Few examples:
- Good commit: feat(orders): add admin lifecycle backend
- Good commit: feat(hardening): add backend launch controls
- Bad commit: update stuff

No-goals:
- Do not rewrite old project history.
- Do not make implementation changes in this phase except docs/checklist updates.

Success criteria:
- git status is clean.
- Remote master includes the phase commits.
- Checks are recorded in the final response.
```

---

# Phase 15 - Configuration Fail-Fast and Owner Lockdown

## Goal

Remove unsafe runtime fallbacks and complete production owner confirmations.

## Build

- Remove runtime fallback database URL from Prisma client creation.
- Remove placeholder OAuth client values from auth configuration.
- Make missing production database/auth configuration fail closed.
- Confirm production owner values:
  - Sunflour address.
  - Moniepoint bank details.
  - WhatsApp proof number.
  - Admin emails and roles.
  - Delivery zones and base fees.
  - 6 PM surcharge rule and close-of-day behavior.
  - Pickup rules and operating hours.
  - Email sender domain/name.
  - R2 bucket and public media URL strategy.
- Update `docs/vercel-deployment.md` and `docs/api-contracts.md` with owner status.

## Tests

- Env validation rejects missing production `DATABASE_URL`.
- Env validation rejects missing production auth values.
- Auth provider config fails closed when Google OAuth values are missing.
- Prisma runtime creation cannot silently use localhost in production.

## Acceptance Criteria

- Production runtime cannot silently connect to localhost.
- Production auth cannot silently use placeholder Google credentials.
- Owner-controlled launch values are either confirmed or explicitly blocked.

## Outcome

Misconfigured production fails before serving traffic.

## Agent Implementation Prompt

```txt
Role:
You are a backend platform engineer hardening runtime configuration.

Task:
Remove unsafe DB/Auth fallbacks and make production config fail fast.

Context:
Read:
- src/server/config/env.ts
- src/server/db/prisma.ts
- prisma.config.ts
- src/server/auth/options.ts
- docs/vercel-deployment.md

Constraints:
- Preserve local developer ergonomics only where explicitly safe.
- Do not commit actual secret values.
- Keep .env.example placeholder-only.

Few examples:
- Good: throw EnvValidationError when production DATABASE_URL is absent.
- Good: Google provider config requires real env values.
- Bad: "missing-google-client-id" placeholder in runtime provider config.

No-goals:
- Do not switch auth providers.
- Do not add a secrets manager dependency.

Success criteria:
- Tests prove missing production config fails.
- No runtime path defaults to localhost DB in production.
```

---

# Phase 16 - CI and CockroachDB Migration Proof

## Goal

Make backend correctness repeatable outside one developer machine.

## Build

- Add GitHub Actions or equivalent CI workflow.
- Run on pull requests and master:
  - `pnpm install --frozen-lockfile`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm db:validate`
  - `pnpm build`
- Add an optional protected database integration job:
  - `RUN_DB_TESTS=true pnpm test`
  - `pnpm db:migrate:deploy`
  - `pnpm db:health`
- Document required CI secrets and ownership.
- Add a basic NextAuth/Prisma adapter smoke test if a test DB is available.

## Tests

- CI workflow validates syntax.
- Main CI passes without live secrets.
- DB integration job is skipped unless safe env values exist.
- Migration deploy succeeds against disposable CockroachDB test DB.

## Acceptance Criteria

- Every PR can prove build/test health.
- Live migration deploy is proven before production.
- Production database is never used for tests.

## Outcome

The backend has repeatable CI and database migration confidence.

## Agent Implementation Prompt

```txt
Role:
You are a CI/CD backend engineer building a safe verification pipeline.

Task:
Add CI for local-safe checks and document an optional CockroachDB integration job.

Context:
Read:
- package.json
- docs/test-database-strategy.md
- .env.example
- prisma/migrations

Constraints:
- Do not require production secrets for default CI.
- Do not run migrations against production.
- Keep DB integration opt-in behind explicit secrets.

Few examples:
- Good: default CI runs lint/typecheck/test/db:validate/build.
- Good: DB job has if guards for test database secrets.
- Bad: CI uses production DATABASE_URL.

No-goals:
- Do not introduce deployment automation until Vercel project ownership is confirmed.

Success criteria:
- CI passes default checks.
- DB workflow is documented and safe.
```

---

# Phase 17 - Email Outbox Production Hardening

## Goal

Make transactional email safe for multiple recipients and concurrent processors.

## Build

- Fix `email_outbox` uniqueness so multiple admin alert recipients can exist for one order/template.
- Add recipient-aware dedupe or explicit dedupe keys.
- Add atomic claim/processing state or safe update guard before sending.
- Prevent duplicate sends from concurrent cron/admin processors.
- Add WhatsApp proof URL to order confirmation email payload.
- Decide invoice email trigger:
  - Queue invoice email during checkout, or
  - Document that order confirmation includes invoice link and invoice email is manual/later.
- Keep checkout non-blocking when email queueing fails, but log the failure safely.

## Tests

- Two admin alert recipients can be queued for one order.
- Duplicate order confirmation remains prevented.
- Appreciation email remains once per delivered order.
- Concurrent processors cannot send the same email twice.
- Disabled template creates `SKIPPED`.
- Resend failure marks `FAILED` and can be retried.

## Acceptance Criteria

- Multiple admin alert recipients work.
- Outbox processing is concurrency-safe.
- Customer email contains the manual payment handoff needed for checkout.
- Email failure remains non-blocking for order creation.

## Outcome

Transactional email becomes production-safe and operationally traceable.

## Agent Implementation Prompt

```txt
Role:
You are a backend engineer hardening an email outbox for commerce operations.

Task:
Fix email outbox dedupe/concurrency and complete the payment proof email handoff.

Context:
Read:
- src/server/modules/email/*
- src/server/modules/checkout/checkout-service.ts
- prisma/schema.prisma
- docs/api-contracts.md

Constraints:
- Do not send email directly outside EmailService.
- Do not let Resend failure break checkout.
- Do not create duplicate customer transactional emails.

Few examples:
- Good: unique(orderId, templateKey, recipientEmail) or a clear dedupeKey.
- Good: queued row is claimed before send.
- Bad: find queued rows and send without ownership/claim.

No-goals:
- Do not add marketing email.
- Do not add newsletter preferences beyond current transactional scope.

Success criteria:
- Multi-admin alert test passes.
- Concurrent processing test passes.
- Checkout email payload includes invoice and WhatsApp proof handoff.
```

---

# Phase 18 - R2 Media Upload Verification

## Goal

Ensure product images marked `READY` actually exist in Cloudflare R2 and match backend-approved metadata.

## Build

- Store requested upload metadata on `media_assets`.
- On completion, verify object existence with R2/S3 `HeadObject`.
- Compare actual object content type and byte size against stored metadata.
- Stop accepting arbitrary `publicUrl` from client completion body.
- Keep media asset `PENDING_UPLOAD` if verification fails.
- Return a typed validation or media error when verification fails.
- Add safe audit logs for successful completion and failed verification attempts.

## Tests

- Completion succeeds when object exists and metadata matches.
- Completion fails when object is missing.
- Completion fails when content type differs.
- Completion fails when byte size differs.
- Product image attach still accepts only `READY` product image assets.

## Acceptance Criteria

- `READY` means backend-verified uploaded object.
- The client cannot fake upload completion.
- Product images cannot point to unverified uploads.

## Outcome

Media uploads satisfy a safer OWASP-style controlled upload flow.

## Agent Implementation Prompt

```txt
Role:
You are a backend security engineer hardening file upload completion.

Task:
Verify R2 object metadata before marking media assets READY.

Context:
Read:
- src/server/modules/media/*
- src/app/api/v1/admin/media/*
- prisma/schema.prisma
- docs/api-contracts.md

Constraints:
- Do not trust client-reported upload completion.
- Do not accept arbitrary publicUrl from the request body.
- Keep signed upload flow and existing file validation.

Few examples:
- Good: HeadObject content length equals media_assets.byte_size.
- Good: HeadObject content type equals media_assets.content_type.
- Bad: update status READY without checking R2.

No-goals:
- Do not build a full asset library UI.
- Do not support non-product uploads yet.

Success criteria:
- READY status is set only after backend verification.
- Failed verification is tested and returns a safe API error.
```

---

# Phase 19 - API Consistency and Audit Completeness

## Goal

Make API errors and admin-critical audit trails consistent across the backend.

## Build

- Make malformed JSON return a typed API error instead of `{}`.
- Map Prisma not-found errors to `NOT_FOUND`.
- Add missing audit logs for:
  - Category create/update/archive.
  - Product create/update/archive.
  - Variant create/archive.
  - Delivery config changes if any gaps remain.
  - Media failed verification.
- Standardize audit metadata shape for before/after values.
- Add a `SUPER_ADMIN` audit log list endpoint with filters:
  - actor.
  - action.
  - target type.
  - target id.
  - date range.
  - pagination.
- Ensure audit endpoint does not expose secrets.

## Tests

- Malformed JSON returns standard error envelope.
- Missing category/product/variant/delivery/media/review/order returns `NOT_FOUND`.
- Each admin-critical mutation writes an audit log.
- Audit list endpoint requires `SUPER_ADMIN`.
- Moderator cannot view audit log endpoint if policy requires super admin.

## Acceptance Criteria

- API error behavior matches contract.
- Admin-critical mutations are traceable.
- Super admins can inspect audit logs without database access.

## Outcome

The backend becomes more debuggable, auditable, and supportable.

## Agent Implementation Prompt

```txt
Role:
You are a backend reliability engineer improving API consistency and auditability.

Task:
Normalize malformed JSON/not-found errors and complete audit logging.

Context:
Read:
- src/server/lib/api/*
- src/server/lib/errors/*
- src/server/modules/audit/*
- src/server/modules/menu/*
- src/server/modules/delivery/*
- src/server/modules/media/*
- docs/api-contracts.md

Constraints:
- Preserve API envelope.
- Do not leak Prisma internals.
- Do not expose secrets in audit metadata.

Few examples:
- Good: Prisma P2025 becomes 404 NOT_FOUND.
- Good: malformed JSON becomes 400 VALIDATION_ERROR.
- Bad: raw stack trace in API response.

No-goals:
- Do not build analytics on audit logs.
- Do not make audit records editable.

Success criteria:
- Tests cover invalid JSON, missing resources, and audit writes.
```

---

# Phase 20 - Order Lifecycle Correctness and Dashboard Semantics

## Goal

Close operational ambiguity in order status transitions and dashboard metrics.

## Build

- Finalize pickup versus delivery status rules.
- Enforce delivery-method-aware transitions:
  - Pickup: `PREPARING -> READY_FOR_PICKUP -> DELIVERED`.
  - Delivery: `PREPARING -> OUT_FOR_DELIVERY -> DELIVERED`.
  - Any exception must be explicit in docs.
- Update `docs/order-lifecycle.md` transition matrix.
- Clarify moderator payment decision policy.
- Clarify rejected payment behavior.
- Split dashboard metrics into:
  - range metrics.
  - current operational backlog metrics.
- Update `docs/api-contracts.md` dashboard contract.

## Tests

- Pickup order cannot move to `OUT_FOR_DELIVERY`.
- Delivery order cannot move to `READY_FOR_PICKUP` unless policy allows it.
- Cancelled/rejected/delivered terminal protections remain.
- Dashboard range metrics use date range consistently.
- Current backlog metrics are labelled as current, not range-based.

## Acceptance Criteria

- Admins cannot create incoherent fulfillment states.
- Dashboard numbers are understandable and contract-backed.
- Order lifecycle docs match actual validators.

## Outcome

Sunflour staff get reliable order operations and trustworthy dashboard metrics.

## Agent Implementation Prompt

```txt
Role:
You are a backend engineer specializing in restaurant order lifecycle correctness.

Task:
Enforce delivery-method-aware transitions and clarify dashboard metric semantics.

Context:
Read:
- src/server/modules/orders/*
- src/server/modules/admin/dashboard-service.ts
- docs/order-lifecycle.md
- docs/api-contracts.md

Constraints:
- Do not loosen terminal order protections.
- Do not merge payment status and order status.
- Do not recalculate old order totals.

Few examples:
- Good: pickup order can become READY_FOR_PICKUP.
- Good: delivery order can become OUT_FOR_DELIVERY.
- Bad: pickup order marked OUT_FOR_DELIVERY.

No-goals:
- Do not add rider tracking.
- Do not add kitchen display system.

Success criteria:
- Transition tests pass.
- Dashboard response clearly separates current and range metrics.
```

---

# Phase 21 - Documentation Sync and Launch Signoff

## Goal

Make docs trustworthy enough for humans, Codex, Claude, Copilot, and launch reviewers.

## Build

- Update `docs/api-contracts.md` from placeholder status to active contract.
- Document every implemented route with:
  - auth requirement.
  - request params/body/query.
  - success shape.
  - expected error codes.
  - side effects.
  - audit behavior.
- Correct `docs/vercel-deployment.md` local evidence.
- Align `docs/database-schema.md` with actual v1 scope.
- Reclassify deferred work:
  - saved addresses.
  - order-linked reviews.
  - super admin break-glass overrides.
  - durable rate limiting.
  - PDF invoice generation.
- Add a final launch checklist with owners.

## Tests

- Route inventory matches `src/app/api/v1`.
- Docs contain no false "placeholder" labels for implemented systems.
- Open decisions are either closed or marked launch-blocking/deferred.

## Acceptance Criteria

- Agents can implement future backend tasks from docs without guessing.
- Launch checklist is actionable.
- Deferred items are explicit and not confused with completed work.

## Outcome

Backend docs become a reliable operating manual for implementation and launch.

## Agent Implementation Prompt

```txt
Role:
You are a technical lead synchronizing backend documentation with implementation.

Task:
Update API, database, lifecycle, and deployment docs to match the real backend.

Context:
Read:
- src/app/api/v1
- src/server/modules
- prisma/schema.prisma
- docs/*
- first-backend-review-26-05-27.MD

Constraints:
- Do not mark owner actions complete unless they are actually complete.
- Do not document fake credentials or project IDs.
- Keep docs action-oriented.

Few examples:
- Good: "Audit log endpoint deferred, launch-blocking only if owner requires UI access."
- Good: "Vercel project not confirmed in local files."
- Bad: "Production ready" while Vercel env is unconfigured.

No-goals:
- Do not write marketing copy.
- Do not duplicate every line of code in docs.

Success criteria:
- Route docs match implementation.
- Launch-blocking decisions are visible.
- Deferred items are explicit.
```

---

# Phase 22 - Preview Smoke Test and Production Launch Gate

## Goal

Prove critical backend flows on Vercel Preview before production.

## Build

- Configure Vercel Preview environment.
- Use a safe Preview database.
- Configure safe Preview payment settings.
- Configure Preview Resend sender or keep sending disabled and test outbox only.
- Configure Preview R2 bucket/prefix.
- Run smoke tests:
  - public health.
  - public menu.
  - delivery quote and 6 PM surcharge.
  - checkout creates order, invoice, payment instruction, WhatsApp proof URL.
  - public invoice requires token.
  - guest order lookup requires order number and phone.
  - admin auth blocks non-admins.
  - admin order status writes event and audit log.
  - manual payment decision writes payment event and audit log.
  - review submission enters pending.
  - review moderation publishes approved reviews only.
  - dashboard excludes sensitive settings.
  - email cron requires secret.
  - R2 presign and completion verification work.

## Tests

- Preview smoke checklist is completed with date, commit hash, and tester.
- Production deployment is blocked if any critical smoke test fails.

## Acceptance Criteria

- Vercel Preview proves the release candidate.
- Production env is configured separately.
- No secret is committed to GitHub.
- Owner signs off launch readiness.

## Outcome

Sunflour backend is ready for production deployment with proof, not hope.

## Agent Implementation Prompt

```txt
Role:
You are a launch engineer validating a production candidate on Vercel Preview.

Task:
Run and document backend smoke tests against the Vercel Preview deployment.

Context:
Read:
- docs/vercel-deployment.md
- docs/api-contracts.md
- first-backend-review-26-05-27.MD

Constraints:
- Do not use production DB for Preview tests.
- Do not publish real secrets.
- Do not mark launch ready if any critical flow fails.

Few examples:
- Good: "Preview checkout created order SFB-... on commit abc123."
- Good: "Email sending disabled; outbox queued record verified."
- Bad: "Assumed Vercel works without testing."

No-goals:
- Do not bypass RBAC to make smoke tests pass.
- Do not test with real customer payment proof.

Success criteria:
- Smoke checklist is complete.
- Production launch gate has signed owner approval.
```

---

## Final Backend 2.0 Definition of Done

Backend 2.0 is complete only when:

```txt
1. Remote master contains the committed implementation.
2. CI passes default checks.
3. Live test database migration deploy passes.
4. Runtime config fails closed when required env is missing.
5. Email outbox supports multiple admin recipients and avoids duplicate sends.
6. R2 upload completion verifies real object metadata.
7. API errors are consistent for malformed JSON and missing records.
8. Admin-critical mutations write audit logs.
9. Order transitions respect delivery method.
10. Dashboard metrics are semantically clear.
11. Docs match the implementation.
12. Vercel Preview smoke tests pass.
13. Production owner data is confirmed.
14. No secret is committed.
```

