# First Backend Review - 2026-05-27

Review run date: 2026-05-28

Requested file name preserved: `first-backend-review-26-05-27.MD`

Scope reviewed: backend work claimed or implied by `backend-implementation.md` Phase 0 through Phase 13, including Prisma schema, migrations, API route handlers, backend services, auth/RBAC, delivery, checkout, payment, invoice, email, orders, customers, reviews, dashboard, launch docs, and tests.

## Role

You are reviewing Sunflour Bakery as a production-bound restaurant ordering backend, not as a demo app. The review stance is senior backend engineering: catch correctness gaps, release blockers, security risks, data integrity issues, test blind spots, and documentation drift before real customers, moderators, or super admins depend on the system.

## Intent

The intent of this review is to decide whether Phase 0 through Phase 13 are ready for a production launch path, and to convert every finding into a phased, actionable superset of `backend-implementation.md`.

This is not a rewrite proposal. It is a launch-readiness review that preserves the current modular monolith direction and identifies the smallest reliable path to production confidence.

## Context

Project facts observed locally:

- Runtime: Next.js App Router route handlers.
- Language: TypeScript strict mode.
- Database: CockroachDB through Prisma.
- Auth: NextAuth/Auth.js v4 with Google OAuth and Prisma adapter.
- Payments: manual bank transfer with admin-managed payment settings.
- Email: Resend through an outbox service.
- Media: Cloudflare R2 presigned upload flow.
- Admin model: `CUSTOMER`, `MODERATOR`, `SUPER_ADMIN`.
- Current branch: `master`.
- Remote: `origin git@github.com:Kingsley-A1/sunflour`.
- Last committed local HEAD: `1c9f1ce Implement transactional email outbox`.
- Working tree: dirty, with many Phase 9-13 files uncommitted and untracked.

## Constraints

- Do not commit real secrets, payment details, OAuth secrets, R2 keys, Resend keys, or production database URLs.
- Do not trust frontend prices, totals, delivery fees, surcharge values, or order statuses.
- Keep route handlers thin and keep business logic in modules/services.
- Preserve existing API envelope: `{ ok: true, data }` and `{ ok: false, error }`.
- Do not make moderators capable of protected super admin mutations.
- Do not send email outside the email module.
- Do not mark media uploads complete without backend-owned validation.
- Do not claim launch readiness when Vercel, database, payment, email, or storage owner actions remain unresolved.

## No-goals

- This review does not redesign the app architecture.
- This review does not replace the modular monolith with a separate backend.
- This review does not review the full frontend UI implementation except where it affects backend verification or release status.
- This review does not invent production secrets, Vercel project IDs, delivery zones, or Sunflour payment details.
- This review does not fix implementation files. It documents findings and the remediation plan.

## Success Criteria

This review is successful when:

- Production blockers are separated from lower-risk findings.
- Every finding has an owner action or engineering action.
- Phase 0 through Phase 13 are mapped to current status.
- Verification results are recorded.
- Documentation drift is called out.
- The follow-up work can be assigned to AI agents without ambiguity.
- The final launch gate is explicit.

## Verification Results

Commands run from `C:\Users\KING MADU\Documents\SUNFLOUR`:

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test` | Passed: 33 test files passed, 1 skipped; 129 tests passed, 1 skipped |
| `pnpm test:coverage` | Passed: 74.23% statements, 58.75% branches, 75% functions, 74.18% lines |
| `pnpm db:validate` | Passed |
| `pnpm build` | Passed |

Checks not run:

- `pnpm db:migrate:deploy` was not run because no `.env` file exists locally and no live CockroachDB `DATABASE_URL` was provided.
- `pnpm db:health` was not run for the same reason.
- Preview deployment smoke tests were not run because the Vercel project is not confirmed in local files.

## Executive Verdict

The backend has a strong foundation and the local build is currently green. The core architecture is pointed in the right direction: strict TypeScript, Prisma schema, route/service separation, Zod validation, API envelopes, RBAC helpers, server-side checkout totals, order snapshots, invoice snapshots, payment events, audit logs, and an email outbox all exist.

The backend is not production-ready yet.

The biggest issue is not a TypeScript failure. It is release integrity and operational proof. Phase 9 through Phase 13 appear to be mostly local working-tree work, not committed to `master` or pushed to the remote branch. Several launch-critical owner decisions are still open. The system also has hard production risks around runtime configuration fallback, email outbox behavior, R2 upload completion, live database/migration verification, and documentation drift.

## Production Blockers

### PB-01 - Phase 9-13 work is not committed or remotely proven

Evidence:

- `git status --short --branch` shows `## master...origin/master` with many modified and untracked files.
- Last committed HEAD is `1c9f1ce Implement transactional email outbox`, while Phase 9-13 code exists as uncommitted changes.
- Untracked Phase 9-13 paths include `src/server/modules/orders/*`, `src/server/modules/customers/*`, `src/server/modules/reviews/*`, `src/server/modules/admin/*`, dashboard routes, review routes, customer routes, and the 20260528013000 migration.

Impact:

- Remote `master` does not represent the reviewed backend.
- Vercel production or preview builds from remote `master` may not contain Phase 9-13.
- Any claim that remote `master` works for Phase 0-13 is currently unproven.

Required action:

- Create a clean batch commit sequence for Phase 9-13 and hardening work.
- Push to `origin/master` only after checks pass.
- Re-run build/test checks from a clean clone or CI job.

Acceptance criteria:

- `git status --short` is clean except intentional local files.
- `origin/master` contains the reviewed schema, migrations, routes, modules, docs, and tests.
- Vercel Preview or equivalent remote build confirms the same commit.

### PB-02 - Vercel project, environment ownership, and product owner data remain unresolved

Evidence:

- `docs/vercel-deployment.md:3` says the repository is not currently linked to a Vercel project in local files.
- `docs/vercel-deployment.md:20-28` leaves Vercel project confirmation unchecked.
- `docs/api-contracts.md:873-883` leaves official address, Moniepoint details, WhatsApp proof number, admin emails, delivery zones, surcharge behavior, pickup rules, operating hours, and sender domain open.
- `backend-implementation.md:2187-2193` lists remaining launch owner actions.

Impact:

- Checkout cannot be considered launch-ready until payment settings, delivery zones, surcharge behavior, and admin allowlist are confirmed.
- Email and media flows cannot be production-tested without Resend sender and R2 credentials.
- Preview/Production separation is documented but not verified.

Required action:

- Complete Phase 0 owner confirmations before launch.
- Add a launch data checklist with owners and signed-off values.
- Configure Vercel Preview and Production variables.
- Run the Preview smoke test checklist.

Acceptance criteria:

- `docs/vercel-deployment.md` has owner names or roles for each environment area.
- Vercel Preview exists and builds this repo.
- Payment settings, delivery zones, surcharge rules, admin allowlist, sender domain, and R2 bucket are configured in the target environment.

### PB-03 - CI and live database migration verification are not established

Evidence:

- `.github` contains `copilot-instructions.md` only; no GitHub Actions workflow was found.
- `src/tests/db/prisma.test.ts:4-5` skips DB tests unless `RUN_DB_TESTS=true` and `DATABASE_URL` exists.
- `docs/test-database-strategy.md:52-59` defers live database tests and migration deploy until CockroachDB test infrastructure exists.
- `package.json:19-20` has migration commands, but they were not run in this review because no live database URL was provided.

Impact:

- Prisma schema validity is proven, but migration deploy against CockroachDB is not proven.
- NextAuth Prisma adapter behavior with the generated Prisma 7 client is not proven against a real database.
- CockroachDB-specific runtime behavior remains a launch risk.

Required action:

- Add CI with `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm db:validate`.
- Add a protected optional job for `RUN_DB_TESTS=true`, `pnpm db:migrate:deploy`, and `pnpm db:health` against a disposable CockroachDB test database.

Acceptance criteria:

- CI is visible in GitHub.
- Migration deploy succeeds against a test CockroachDB database.
- Auth/session adapter smoke test succeeds against the same database.

### PB-04 - Runtime configuration can fall back to local DB and placeholder OAuth values

Evidence:

- `src/server/db/prisma.ts:4-13` uses `postgresql://root@localhost:26257/sunflour?sslmode=disable` when `DATABASE_URL` is missing.
- `prisma.config.ts:4-13` uses the same fallback.
- `src/server/auth/options.ts:12-24` returns `missing-google-client-id` and `missing-google-client-secret` when OAuth variables are absent.
- `src/server/config/env.ts:72-88` validates production auth vars, but route/runtime code does not consistently call `getServerEnv()` before constructing Prisma/Auth dependencies.

Impact:

- Production misconfiguration may attempt a local database connection instead of failing cleanly at startup.
- Auth configuration can be constructed with placeholder OAuth credentials.
- Fail-fast env validation exists, but it is not the single source of truth for all runtime dependencies.

Required action:

- Remove fallback database URLs from runtime Prisma client creation.
- Keep fallback only for explicitly documented local dev commands if truly needed.
- Make Auth provider config fail closed when required values are missing.
- Add a boot/config test that imports auth and Prisma config under production-like missing env and verifies failure.

Acceptance criteria:

- No production runtime path can silently use localhost DB or placeholder OAuth credentials.
- Missing production DB/Auth env fails with a clear `EnvValidationError` before serving traffic.

### PB-05 - Email outbox can fail or duplicate in production scenarios

Evidence:

- `prisma/schema.prisma:487` has `@@unique([orderId, templateKey])` on `email_outbox`.
- `src/server/modules/email/email-service.ts:237-257` queues one `ADMIN_NEW_ORDER_ALERT` per configured admin recipient with the same `orderId` and `templateKey`.
- `src/server/modules/email/email-service.ts:417-445` processes queued messages by reading all queued rows and then sending each one without a DB claim/lock step.
- `src/server/modules/email/email-service.ts:296-390` reads a queued email, sends it, then updates status, so concurrent workers can send the same email.

Impact:

- Multiple admin alert recipients can violate the unique constraint. Checkout swallows email queue errors, so the order succeeds but alerts can be missing or partial.
- Concurrent cron/admin processing can send duplicate emails.
- Email correctness is not yet production-grade.

Required action:

- Change the uniqueness model to allow multiple recipients per order/template, for example `@@unique([orderId, templateKey, recipientEmail])`, or introduce an outbox purpose/dedupe key.
- Add an atomic claim step for processing queued emails.
- Add tests for multiple admin recipients and concurrent processing.

Acceptance criteria:

- Two or more admin alert recipients can be queued for one order.
- A queued email can be processed by only one worker at a time.
- Checkout still succeeds when email queueing fails, but failures are observable.

### PB-06 - R2 upload completion trusts the client and does not verify the uploaded object

Evidence:

- `src/server/modules/media/media-schemas.ts:13-19` validates requested file metadata before presign.
- `src/server/modules/media/media-service.ts:73-83` signs a PUT request with requested metadata.
- `src/server/modules/media/media-service.ts:130-140` marks the media asset `READY` without checking R2 object existence, actual content type, or actual byte size.
- `src/app/api/v1/admin/media/[id]/complete/route.ts:29-34` accepts optional `publicUrl` from the request body.

Impact:

- The database can mark an asset ready even if no object exists or the uploaded object differs from the requested metadata.
- File validation is not complete by OWASP upload standards.
- Product images can reference broken or unverified media.

Required action:

- On completion, use R2/S3 `HeadObject` to verify object exists, content type matches, and size matches.
- Do not accept arbitrary `publicUrl` from the client for product media.
- Keep status `PENDING_UPLOAD` if verification fails.

Acceptance criteria:

- Completion fails for missing object, wrong content type, or wrong size.
- `READY` means the backend verified the uploaded object.

## High Severity Findings

### H-01 - Invalid JSON is silently treated as an empty object

Evidence:

- `src/server/lib/api/request.ts:1-5` catches JSON parse errors and returns `{}`.
- Several schemas have all-optional bodies, for example `emailTemplateUpdateSchema` in `src/server/modules/email/email-schemas.ts:32-37`.

Impact:

- A malformed JSON request can become a valid empty update on optional PATCH routes.
- Clients receive field validation only when required fields are missing, not a clear malformed JSON error.

Required action:

- Make `readJsonBody()` throw `VALIDATION_ERROR` or `BAD_REQUEST` for malformed JSON.
- Add tests for invalid JSON on required and optional-body routes.

### H-02 - Not-found errors from Prisma updates can become 500s

Evidence:

- `src/server/lib/errors/app-error.ts:20-29` maps unknown errors to `INTERNAL_ERROR`.
- `src/server/modules/menu/catalog-service.ts:185-202` updates/archives categories without first checking existence.
- `src/server/modules/menu/catalog-service.ts:302-359` creates/archives variants without full not-found mapping for all paths.

Impact:

- Missing records can return generic 500 responses instead of `404 NOT_FOUND`.
- API consistency is weaker than the contract promises.

Required action:

- Wrap Prisma `P2025` as `NOT_FOUND`, either centrally or per service.
- Add route tests for missing category, product, variant, delivery zone, media asset, review, and order IDs.

### H-03 - Order status transitions ignore delivery method

Evidence:

- `src/server/modules/orders/order-service.ts:21-52` allows `PREPARING -> READY_FOR_PICKUP` and `PREPARING -> OUT_FOR_DELIVERY` without checking `order.deliveryMethod`.
- `docs/order-lifecycle.md:193-194` leaves pickup/delivery status policy open.

Impact:

- A delivery order can be marked ready for pickup.
- A pickup order can be marked out for delivery.
- Admin operations can produce confusing customer states.

Required action:

- Finalize the delivery-method transition matrix.
- Include `deliveryMethod` in `updateAdminOrderStatus` validation.
- Add tests for pickup-only and delivery-only transitions.

### H-04 - Email confirmation omits the WhatsApp proof URL, and invoice email is not queued in checkout

Evidence:

- `src/server/modules/email/email-template-service.ts:88-95` supports `whatsAppProofUrl`.
- `src/server/modules/email/email-template-service.ts:154` renders a WhatsApp proof CTA only if that payload exists.
- `src/server/modules/email/email-service.ts:126-135` builds order email payload without `whatsAppProofUrl`.
- `src/server/modules/checkout/checkout-service.ts:423-424` queues order confirmation and admin alert, but not `queuePurchaseInvoiceEmailForOrder`.

Impact:

- The customer email may not include the proof handoff link required by the manual payment workflow.
- Purchase invoice email infrastructure exists but is not connected to checkout.

Required action:

- Add WhatsApp proof URL to email payload generation.
- Decide whether checkout should queue both order confirmation and purchase invoice emails, or document the single-email strategy and remove the unused claim.

### H-05 - Catalog/category/variant mutations are not fully audited

Evidence:

- `src/server/modules/menu/catalog-service.ts:176-203` category create/update/archive has no audit log.
- `src/server/modules/menu/catalog-service.ts:225-289` product create/update audits price changes but not product creation or non-price field changes.
- `src/server/modules/menu/catalog-service.ts:302-359` variant create/archive has no audit log except price update on patch.

Impact:

- Admin-critical catalog mutations are not fully traceable.
- This conflicts with the project rule that every admin-critical mutation writes `audit_logs`.

Required action:

- Add audit logs for category create/update/archive, product create/update/archive, variant create/archive, and product image attach.
- Standardize metadata shape for before/after values.

### H-06 - Dashboard date-range semantics are inconsistent

Evidence:

- `src/server/modules/admin/dashboard-service.ts:65-137` applies the selected range to some metrics.
- `pendingPaymentConfirmation`, `preparingOrders`, and `outForDeliveryOrders` are not range-filtered, while `ordersInRange`, `guestOrdersInRange`, `cancelledOrders`, `deliveredOrders`, sales, and top items are range-filtered.

Impact:

- Admin dashboard numbers can look inconsistent when a date range is selected.
- Frontend may display mixed "current backlog" and "range total" metrics without knowing the difference.

Required action:

- Split dashboard response into `rangeMetrics` and `currentOperationalMetrics`, or apply range consistently.
- Document the semantics in `docs/api-contracts.md`.

### H-07 - API contract and launch docs have stale or contradictory status

Evidence:

- `docs/api-contracts.md:3` still says "placeholder for Phase 0" even though many contracts are implemented.
- `docs/api-contracts.md:54-65` has unchecked route-contract items after implementation.
- `docs/vercel-deployment.md:10-13` says `package.json` and Git metadata are not present, but both are present in this workspace.
- `docs/database-schema.md:489` leaves audit log indexes unchecked even though Prisma schema has audit log indexes.

Impact:

- AI agents and humans can make wrong implementation choices from stale docs.
- Launch signoff becomes unreliable.

Required action:

- Update docs to active contracts, not placeholders.
- Re-run a route inventory and document auth, response shape, errors, and side effects for every implemented route.

## Medium Severity Findings

### M-01 - Tests are green but heavily mocked, with live integrations skipped

Evidence:

- `pnpm test` passed.
- `pnpm test:coverage` reports only 58.75% branch coverage.
- `src/tests/db/prisma.test.ts:4-5` skips database tests by default.
- `vitest.config.ts:15` includes only `src/**/*.test.ts`, excluding `.test.tsx` files.
- `resend-client.ts` has 0% coverage in the coverage report.

Impact:

- Route contracts are tested mostly by mocked services.
- Live CockroachDB, NextAuth adapter, Resend, R2, and Vercel runtime behavior remain unproven.

Required action:

- Add integration smoke tests behind safe env flags.
- Include `.test.tsx` when frontend tests are intentionally part of the repo checks, or move frontend tests to their own config.
- Add coverage thresholds after stabilizing the first launch.

### M-02 - In-memory rate limiting is a baseline only

Evidence:

- `src/server/lib/rate-limit/rate-limit.ts` uses a process-local `Map`.
- `docs/vercel-deployment.md:140` acknowledges a durable shared backend is needed before higher traffic.
- `src/server/lib/api/request.ts:8-18` trusts forwarded IP headers.

Impact:

- Multiple Vercel instances do not share counters.
- Limits reset on cold start.
- IP-based limits are easy to bypass compared with durable rate limiting.

Required action:

- Keep this for local/test.
- Add a durable rate-limit store before production traffic grows, especially for checkout, reviews, guest lookup, media presign, and cron/webhook routes.

### M-03 - Payment settings update can reactivate disabled settings implicitly

Evidence:

- `src/server/modules/payments/payment-service.ts:174-185` sets `isActive: input.isActive ?? true` on update.
- `changedPaymentSettingFields()` compares only the raw input, so implicit reactivation may not be accurately audited.

Impact:

- Updating bank copy on an inactive settings row can reactivate checkout payment settings unintentionally.

Required action:

- Preserve existing `isActive` when the input omits it.
- Audit effective before/after values.

### M-04 - Moderator visibility of payment account details conflicts with docs

Evidence:

- `docs/api-contracts.md:650` says moderators cannot view or update payment account settings.
- `src/server/modules/orders/order-service.ts:87-88` includes payment instruction and proof WhatsApp snapshots in admin order detail.
- Admin order detail route allows `MODERATOR | SUPER_ADMIN`.

Impact:

- Moderators cannot access the payment settings endpoint, but they can see bank detail snapshots on orders.
- This may be acceptable because the same details are customer-facing, but the policy is currently inconsistent.

Required action:

- Decide whether order payment snapshots are visible to moderators.
- Update docs and response contracts accordingly.

### M-05 - Public health route does not use the standard error handler

Evidence:

- `src/app/api/v1/public/health/route.ts:1-15` calls `getServerEnv()` and returns `apiSuccess()`, but has no `try/catch` with `apiError()`.

Impact:

- Invalid env can produce a raw framework error instead of the standard API error envelope.

Required action:

- Wrap public health in the same error handling pattern as admin health.

### M-06 - Timezone behavior is not centralized

Evidence:

- `src/server/modules/admin/dashboard-service.ts:24` uses `APP_TIME_ZONE`.
- `src/server/modules/delivery/delivery-calculator.ts:70` defaults to `Africa/Lagos`.
- `src/server/modules/invoices/invoice-renderer.ts:58` hardcodes `Africa/Lagos`.

Impact:

- If the app timezone changes, delivery quote, dashboard, and invoice rendering can diverge.

Required action:

- Use one timezone source for delivery, dashboard, invoice rendering, and smoke tests.

### M-07 - Address support remains deferred

Evidence:

- `docs/database-schema.md:105` lists `addresses` as a required table.
- `backend-implementation.md:1779-1783` defers saved addresses.
- `prisma/schema.prisma` has no `Address` model.

Impact:

- Phase 10 is acceptable for v1 guest/auth order history, but saved addresses are not implemented.

Required action:

- Either remove `addresses` from the v1 required table list or schedule it as Phase 10A with an approved schema.

### M-08 - Audit logs exist but no admin audit endpoint exists

Evidence:

- `docs/api-contracts.md:461` leaves audit log endpoint unchecked.
- `src/server/modules/audit/audit-service.ts` can write logs, but no route exposes them.

Impact:

- Traceability is stored but not operationally visible to super admins.

Required action:

- Add a super-admin-only audit log endpoint with filters and pagination.

### M-09 - Idempotency and order number collision behavior need hardening

Evidence:

- `src/server/modules/checkout/checkout-service.ts:270-286` looks up existing orders by idempotency key only.
- `src/server/modules/checkout/checkout-ids.ts:18-24` generates a random 6-character order suffix.
- Unique order number conflicts are not retried.

Impact:

- Idempotency relies on high-entropy client keys and exact request hashes, but is not scoped by user/session.
- Rare order number collisions can become checkout 500s.

Required action:

- Scope idempotency lookup by authenticated user or guest-safe client context where practical.
- Retry order number generation on unique conflicts.

## Phase-by-Phase Review

### Phase 0 - Product Backend Lockdown

Status: Partially complete.

What is solid:

- AI instruction files exist.
- API/database/deployment docs exist.
- Vercel workflow is documented.

Gaps:

- Product owner decisions are still open in `docs/api-contracts.md`.
- Vercel project confirmation is still unchecked.
- Delivery/payment/admin/email owner data is not signed off.

Next actions:

- Complete owner confirmations before more launch work.
- Treat unresolved product rules as blockers, not notes.

### Phase 1 - Backend Foundation

Status: Mostly complete locally.

What is solid:

- Strict TypeScript is enabled.
- Prisma validates.
- API envelope, errors, validation, money utilities, health endpoint, and tests exist.
- Local build/test gates pass.

Gaps:

- Runtime DB fallback weakens fail-fast production behavior.
- Live DB migration tests are deferred.
- No CI workflow exists.

Next actions:

- Remove unsafe runtime fallbacks.
- Add CI and live test database workflow.

### Phase 2 - Authentication, RBAC, and Admin Access

Status: Functionally implemented, integration risk remains.

What is solid:

- NextAuth Google provider exists.
- Prisma auth tables exist.
- `requireAuth()` and `requireRole()` enforce active admin profiles.
- Admin allowlist seed exists.
- RBAC tests cover helper behavior.

Gaps:

- OAuth config can use placeholders.
- NextAuth/Prisma adapter is not tested against a live CockroachDB database.
- Moderator payment visibility policy is inconsistent.

Next actions:

- Fail closed on missing auth env.
- Add auth integration smoke test.
- Finalize moderator visibility policy.

### Phase 3 - Menu, Categories, Products, and Media

Status: Implemented with audit and media hardening gaps.

What is solid:

- Category/product/variant schema exists.
- Public menu and product detail visibility rules exist.
- Admin CRUD/status routes exist.
- R2 presign flow exists.
- Product price snapshots are used by checkout.

Gaps:

- Category/product/variant audit logs are incomplete.
- Missing records can map to 500s.
- R2 upload completion does not verify actual uploaded object.

Next actions:

- Add missing audit logs.
- Normalize Prisma not-found handling.
- Verify R2 object metadata before `READY`.

### Phase 4 - Delivery Zones and 6 PM Surcharge

Status: Implemented with configuration consistency gaps.

What is solid:

- Delivery zones and surcharge rules exist.
- Public quote endpoint recalculates server-side.
- Pickup returns zero.
- Tests cover before, exactly at, and after 6 PM.

Gaps:

- Timezone source is hardcoded in delivery calculation defaults.
- Delivery zones and surcharge owner data are still unconfirmed.

Next actions:

- Use `APP_TIME_ZONE` consistently.
- Seed or configure approved delivery zones and surcharge rules before launch.

### Phase 5 - Cart and Checkout Backend

Status: Core checkout implemented.

What is solid:

- Checkout schema rejects client-submitted totals.
- Server recalculates line items and delivery.
- Order snapshots, invoice snapshot, payment snapshot, and initial status event are created.
- Idempotency exists.

Gaps:

- No live DB transaction test.
- Order number collision retry is missing.
- Idempotency scope/privacy should be tightened.
- Authenticated cart persistence exists in schema but not as a full cart API.

Next actions:

- Add checkout integration tests with test DB.
- Add unique-conflict retry for order numbers.

### Phase 6 - Payment Settings and Manual Payment Workflow

Status: Implemented with policy and audit refinements needed.

What is solid:

- Payment settings table exists.
- Settings endpoint is super-admin-only.
- Checkout snapshots payment instructions.
- Payment status transitions and events exist.
- Confirmation/rejection audit logs exist.

Gaps:

- Payment settings update can reactivate disabled settings unintentionally.
- Moderator payment decision policy remains open in lifecycle docs.
- Payment settings need approved production values.

Next actions:

- Preserve existing `isActive` unless explicitly changed.
- Finalize moderator payment permissions.
- Configure production payment settings through admin, not seed secrets.

### Phase 7 - Invoice Backend

Status: Implemented.

What is solid:

- Invoice number and public access token exist.
- Invoice HTML snapshot is stored.
- Public, customer, and admin invoice access exist.
- Invoice tests cover snapshot stability and escaping.

Gaps:

- Invoice rendering hardcodes `Africa/Lagos`.
- PDF generation remains deferred, which is acceptable if documented.

Next actions:

- Centralize timezone.
- Keep PDF as later unless business requires it before launch.

### Phase 8 - Resend Email System

Status: Implemented but not production-safe yet.

What is solid:

- Email module owns Resend calls.
- Email outbox, events, templates, retry, admin routes, and cron route exist.
- Checkout does not fail when email queueing fails.

Gaps:

- Multiple admin alert recipients conflict with the unique index.
- Outbox processing is not concurrency-safe.
- Order confirmation email lacks WhatsApp proof URL payload.
- Purchase invoice email function exists but is not queued from checkout.
- React Email templates were planned, but implementation uses string renderers.

Next actions:

- Fix outbox dedupe key and processing claim.
- Connect WhatsApp proof URL and invoice email strategy.
- Either adopt React Email or update plan/docs to accept string renderer v1.

### Phase 9 - Order Lifecycle Admin Backend

Status: Implemented locally, not committed.

What is solid:

- Admin list/detail routes exist.
- Status updates and admin notes exist.
- Status events and audit logs exist.
- Terminal status protections exist.

Gaps:

- Delivery-method-specific transitions are unresolved.
- Super admin break-glass policy is deferred.
- Email status updates remain optional/deferred.

Next actions:

- Finalize delivery/pickup transition matrix.
- Commit and push implementation after checks.

### Phase 10 - Customer Profile and Guest Tracking

Status: Implemented for v1 scope, with saved addresses deferred.

What is solid:

- Profile read/update exists.
- Customer own-order list/detail exists.
- Guest lookup requires order number and phone match.
- Guest count helper exists.

Gaps:

- Saved addresses are missing.
- Reorder support is deferred.
- Guest lookup security depends on phone normalization and rate limiting.

Next actions:

- Document saved-address deferral clearly.
- Add durable rate limiting before high traffic.

### Phase 11 - Reviews and Moderation

Status: Implemented.

What is solid:

- Public reviews enter pending.
- Public list returns approved reviews only.
- Admin moderation writes audit log.
- Public submission is rate-limited.

Gaps:

- Order-linked review verification is deferred.
- Rate limit is in-process only.

Next actions:

- Decide whether v1 requires order-linked reviews.
- Move spam/rate controls to durable store before scale.

### Phase 12 - Admin Dashboard Metrics

Status: Implemented with semantic clarity needed.

What is solid:

- One admin endpoint exists.
- Sales estimate is conservative.
- Top items use order item snapshots.
- Sensitive settings are not directly exposed.

Gaps:

- Date range semantics are mixed across metrics.
- Dashboard tests are service-level/mocked and not live DB integration.

Next actions:

- Split current backlog metrics from range metrics.
- Add seeded DB dashboard aggregation test.

### Phase 13 - Hardening, Performance, and Launch Readiness

Status: Started, not complete.

What is solid:

- Security headers exist for `/api/*`.
- Rate limits exist on sensitive endpoints.
- Sanitized 500 logging exists.
- Index migration exists.
- Launch docs exist.

Gaps:

- Rate limiting is in-memory.
- No error monitoring hook exists beyond logs.
- Vercel project is not confirmed.
- CI is missing.
- Live DB migration and smoke tests are not complete.
- Some launch docs are stale.

Next actions:

- Add CI, remote preview verification, durable rate-limit decision, and smoke-test evidence.

## Actionable Superset Roadmap

### Batch A - Release Integrity

1. Split uncommitted work into phase-based commits.
2. Commit the Phase 9-13 migration, routes, services, tests, and docs.
3. Push `master`.
4. Re-run checks from a clean clone or CI.

Done when:

- Remote `master` has all reviewed backend work.
- Working tree is clean.
- Vercel or CI proves the remote commit builds.

### Batch B - Configuration and Owner Lockdown

1. Remove runtime fallback DB URLs.
2. Fail closed for missing auth provider env.
3. Complete Vercel project confirmation.
4. Confirm production payment, WhatsApp, delivery zones, surcharge, admin emails, sender domain, and R2 bucket.

Done when:

- Missing production env fails before serving traffic.
- Owner data is confirmed in docs and configured in Vercel/admin.

### Batch C - Database and CI Proof

1. Add GitHub Actions or equivalent CI.
2. Add optional CockroachDB test database job.
3. Run `pnpm db:migrate:deploy` and `pnpm db:health` in safe CI/test environment.
4. Add auth/session adapter smoke test.

Done when:

- Schema validation, migrations, and DB health are proven outside a developer laptop.

### Batch D - Email Outbox Hardening

1. Change email outbox uniqueness to support multiple admin recipients.
2. Add processing claim/lock to prevent duplicate sends.
3. Add WhatsApp proof URL to order email payload.
4. Decide invoice email trigger.
5. Add tests for multiple recipients, retry, disabled sending, and concurrent processing.

Done when:

- One order can alert multiple admins.
- One queued email cannot be sent twice by parallel workers.

### Batch E - Media Upload Verification

1. Add R2 `HeadObject` verification on upload completion.
2. Reject completion when object metadata does not match presigned request.
3. Stop accepting arbitrary public URL from the client.
4. Add tests with mocked R2 verification.

Done when:

- `READY` media assets are backend-verified.

### Batch F - API Consistency and Audit Completeness

1. Throw a typed error for malformed JSON.
2. Map Prisma not-found errors to `NOT_FOUND`.
3. Add missing audit logs for catalog/category/variant mutations.
4. Add super-admin audit log endpoint.
5. Wrap public health errors in the standard envelope.

Done when:

- API error responses match contract across missing resource and invalid input paths.
- Admin-critical mutations are traceable.

### Batch G - Order and Dashboard Correctness

1. Finalize pickup versus delivery status transitions.
2. Validate order status changes against delivery method.
3. Clarify dashboard range versus current backlog metrics.
4. Add seeded tests for dashboard aggregation.

Done when:

- Admins cannot produce invalid fulfillment states.
- Dashboard labels match query semantics.

### Batch H - Documentation Sync

1. Update `docs/api-contracts.md` from placeholder to active contract.
2. Document every implemented route with auth, request, response, errors, and side effects.
3. Correct `docs/vercel-deployment.md` local evidence.
4. Align `docs/database-schema.md` with actual deferred address/audit decisions.
5. Close or reclassify open product decisions.

Done when:

- Docs are trustworthy enough for Codex, Claude, Copilot, and human reviewers.

## Few Examples for Follow-up Agents

### Example 1 - Malformed JSON handling

Good behavior:

```txt
Request body: "{invalid"
Response: 400 VALIDATION_ERROR or BAD_REQUEST
No service mutation is called.
```

Agent task:

```txt
Update readJsonBody() so malformed JSON throws AppError.
Add route tests for malformed JSON on payment settings, email template update, and checkout.
Do not change the API response envelope.
```

### Example 2 - Multiple admin email recipients

Good behavior:

```txt
ADMIN_ORDER_ALERT_EMAILS="a@example.com,b@example.com"
Checkout creates two ADMIN_NEW_ORDER_ALERT outbox records for the same order.
No unique constraint error occurs.
```

Agent task:

```txt
Change email_outbox dedupe from orderId + templateKey to a recipient-aware key.
Add migration and tests.
Do not remove duplicate protection for customer order confirmation, purchase invoice, or appreciation email.
```

### Example 3 - Delivery method status validation

Good behavior:

```txt
PICKUP order: PREPARING -> READY_FOR_PICKUP -> DELIVERED.
DELIVERY order: PREPARING -> OUT_FOR_DELIVERY -> DELIVERED.
DELIVERY order cannot move to READY_FOR_PICKUP unless business explicitly approves it.
PICKUP order cannot move to OUT_FOR_DELIVERY.
```

Agent task:

```txt
Extend validateOrderStatusTransition() to receive deliveryMethod.
Update service select to include deliveryMethod.
Add tests for pickup-only and delivery-only transitions.
```

### Example 4 - R2 completion verification

Good behavior:

```txt
Complete upload checks R2 object exists.
Stored byteSize matches HeadObject content length.
Stored contentType matches HeadObject content type.
Only then mark media asset READY.
```

Agent task:

```txt
Add injectable object metadata lookup for tests.
Do not trust publicUrl from client input.
Keep product image attach restricted to READY assets.
```

## Agent-Ready Remediation Prompt

Role:

You are a principal backend engineer hardening Sunflour Bakery's Next.js App Router modular monolith for production launch. You specialize in commerce correctness, restaurant order operations, Prisma/CockroachDB integrity, RBAC, email outbox safety, upload security, and Vercel deployment discipline.

Intent:

Resolve the findings in `first-backend-review-26-05-27.MD` without broad rewrites. Preserve the existing architecture and make Phase 0 through Phase 13 production-verifiable.

Context:

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
Local typecheck, lint, tests, coverage, Prisma validate, and build passed on 2026-05-28.
The working tree has uncommitted Phase 9-13 work.
Live CockroachDB migration and Vercel Preview smoke tests were not run.
Production owner data is still incomplete.
```

Constraints:

```txt
Use pnpm only.
Do not add production dependencies without approval.
Do not commit secrets.
Do not change API envelopes.
Do not move business logic into route handlers.
Do not trust client prices, fees, totals, statuses, or upload metadata.
Do not break existing passing tests.
Do not claim launch readiness without remote build and environment proof.
```

No-goals:

```txt
Do not replace Next.js App Router.
Do not introduce a separate backend.
Do not build Paystack/card payment.
Do not build advanced inventory, coupons, loyalty, SMS, or rider tracking.
Do not implement frontend redesign in this backend remediation batch.
```

Tasks:

```txt
1. Commit/push release-integrity batches after checks pass.
2. Remove unsafe runtime config fallbacks.
3. Add CI and live DB migration strategy.
4. Fix email outbox dedupe and concurrency.
5. Verify R2 uploads before marking READY.
6. Normalize malformed JSON and Prisma not-found errors.
7. Complete catalog/category/variant audit logging.
8. Enforce delivery-method-aware order transitions.
9. Clarify dashboard metric semantics.
10. Sync docs to the real implementation.
```

Success criteria:

```txt
pnpm lint passes.
pnpm typecheck passes.
pnpm test passes.
pnpm test:coverage passes or documented threshold is met.
pnpm db:validate passes.
pnpm build passes.
Live test database migration deploy passes before launch.
Vercel Preview smoke checklist passes before production.
Every production blocker in this review is closed or explicitly accepted by the owner with a documented reason.
```

## Final Launch Gate

Do not launch until these are true:

- Remote `master` contains the reviewed backend work.
- CI or a clean clone passes the required checks.
- CockroachDB migration deploy has run against a disposable test database.
- Vercel Preview is configured and smoke-tested.
- Payment settings, delivery zones, surcharge rule, admin allowlist, sender domain, and R2 bucket are configured.
- Email outbox supports multiple admin recipients and prevents duplicate processing.
- R2 upload completion verifies the uploaded object.
- Delivery/pickup status transitions are finalized and tested.
- API docs reflect actual implemented routes and side effects.

