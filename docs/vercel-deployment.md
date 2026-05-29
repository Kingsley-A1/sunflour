# Vercel Deployment Plan - Sunflour Bakery

Status: Backend 2.0 launch-readiness document. This repository is not currently linked to a Vercel project in local files; owner confirmation is still required before production.

## Current Local Evidence

Checked on 2026-05-28:

```txt
.vercel/project.json: not present
vercel.json: not present
.github/workflows/backend-ci.yml: present
package.json: pnpm scripts present
Git branch: master tracks origin/master; Backend 2.0 changes are uncommitted locally
```

Do not invent Vercel project IDs, team IDs, domains, or secret values. The human maintainer must confirm those values in Vercel.

## Required Vercel Project Confirmation

- [ ] Vercel project exists.
- [ ] Vercel project is connected to the correct GitHub repository.
- [ ] Production branch is confirmed.
- [ ] Project framework preset is Next.js.
- [ ] Build command uses `pnpm build`.
- [ ] Install command uses `pnpm install`.
- [ ] Output settings follow Vercel Next.js defaults unless a later phase proves otherwise.
- [ ] Production domain is confirmed.
- [ ] Preview deployment URLs are available for pull requests.

## GitHub CI

Default CI is configured in `.github/workflows/backend-ci.yml` for pull requests and pushes to `master`.

Default local-safe job:

```txt
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm db:validate
pnpm build
```

Optional CockroachDB integration job:

```txt
Runs only outside pull requests when COCKROACH_TEST_DATABASE_URL is configured.
Uses RUN_DB_TESTS=true.
Runs pnpm db:migrate:deploy, pnpm test, and pnpm db:health.
Must point at a disposable test database, never production.
```

Required GitHub Actions secrets for the optional job:

```txt
COCKROACH_TEST_DATABASE_URL
COCKROACH_SHADOW_DATABASE_URL optional, only if a workflow later needs shadow DB operations
```

## Preview Deployment Workflow

Required workflow:

```txt
feature branch -> pull request -> Vercel Preview Deployment -> checks -> review -> merge -> Production Deployment
```

Every meaningful PR must include:

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Mobile storefront smoke test on Preview.
- [ ] Checkout smoke test on Preview when checkout is touched.
- [ ] Admin smoke test on Preview when admin is touched.
- [ ] Email/payment/manual proof smoke test when those flows are touched.
- [ ] Admin dashboard metrics smoke test when dashboard or order queries are touched.
- [ ] Review submission/moderation smoke test when reviews are touched.
- [ ] Guest order lookup smoke test when customer/order access is touched.

No direct production edits.

## Environment Variable Ownership

AI agents may document required variable names and usage. AI agents must not create, paste, rotate, or commit secret values.

| Area | Examples | Owner | Preview | Production |
| --- | --- | --- | --- | --- |
| Database | `DATABASE_URL` | Maintainer | Separate preview database or safe preview branch | Production CockroachDB |
| Auth | `AUTH_SECRET`, OAuth client IDs/secrets | Maintainer | Preview OAuth app or allowed preview callback URLs | Production OAuth app |
| Email | `RESEND_API_KEY`, sender domain/name | Maintainer | Resend test/preview-safe sender | Verified production sender |
| Storage | R2 access keys, bucket, account ID | Maintainer | Preview bucket/prefix | Production bucket |
| Payment | Moniepoint account details, WhatsApp proof number | Maintainer / Sunflour owner | Test or approved preview values | Verified production values |
| App config | public site URL, timezone, feature flags | Maintainer | Preview URL/config | Production URL/config |

## Required Environment Checklist

- [ ] Preview and Production values are separate where risk exists.
- [ ] No `.env` files are committed.
- [ ] Secrets live in Vercel Environment Variables.
- [ ] GitHub Actions does not store production secrets unless explicitly required later.
- [ ] Payment settings are managed through the app/admin database after the payment module exists, not hardcoded into frontend code.
- [ ] Email sender domain is verified before production email is enabled.
- [ ] R2 upload credentials are scoped to required buckets only.
- [ ] `APP_TIME_ZONE` is set to `Africa/Lagos` unless Sunflour approves a different operating timezone.
- [ ] `EMAIL_CRON_SECRET` is unique per environment.
- [ ] Vercel Cron is configured for `/api/v1/webhooks/cron/email-outbox` only after `EMAIL_CRON_SECRET` is set.

## Owner-Controlled Launch Values

These remain launch-blocking until confirmed by the maintainer/Sunflour owner and entered in the correct environment, not committed to Git:

```txt
- Official Sunflour address.
- Verified Moniepoint bank name, account name, and account number.
- WhatsApp proof number.
- Admin emails and role assignments.
- Delivery zones and base fees.
- 6 PM surcharge enabled/disabled policy and close-of-day behavior.
- Pickup rules and operating hours.
- Email sender domain/name.
- R2 bucket, credentials, and public media URL strategy.
```

## Production Seed Strategy

Seed only non-secret operational data through `pnpm db:seed`:

```txt
- Admin users come from ADMIN_ALLOWLIST_EMAILS.
- Menu data can load from SUNFLOUR_MENU_SEED_PATH.
- Payment settings must be entered through the super_admin payment settings route, not committed seed data.
- Delivery zones and surcharge rules can be seeded only with owner-approved values.
```

Do not commit real Moniepoint credentials, Resend keys, OAuth secrets, R2 keys, or production database URLs.

## Backup And Export Strategy

Owner actions before launch:

```txt
- Confirm CockroachDB automated backups and restore window.
- Document who can restore the production database.
- Export product/menu/payment/delivery settings before major admin changes.
- Keep preview and production databases separated.
```

## Backend Smoke Test Checklist

Run on Vercel Preview before production. Record the date, tester, commit hash, preview URL, and pass/fail result for each item:

```txt
- Public health endpoint returns ok.
- Menu endpoint returns active categories/products only.
- Delivery quote returns pickup as zero and applies the 6 PM surcharge in Africa/Lagos after 18:00.
- Guest checkout creates order, invoice, payment instruction, and WhatsApp proof URL.
- Public invoice opens only with token.
- Guest order lookup requires order number + phone.
- Admin auth blocks non-admin users.
- Admin order status update writes timeline and audit log.
- Manual payment confirmation writes payment event and audit log.
- Review submission creates PENDING review.
- Review moderation publishes only APPROVED reviews publicly.
- Dashboard endpoint returns metrics without sensitive settings.
- Email outbox processing is protected by EMAIL_CRON_SECRET.
- R2 presign endpoint requires super_admin and validates upload metadata.
- R2 completion verifies HeadObject content type and byte size before READY.
```

Current smoke status as of 2026-05-28:

```txt
Preview URL: not provided
Commit hash: not remotely confirmed
Tester: not recorded
Result: blocked until Vercel Preview environment exists
```

## Hardening Notes

Implemented backend hardening:

```txt
- Standard API error envelope remains in use.
- Sensitive endpoints have explicit rate-limit coverage.
- API 500 errors log sanitized code/status/message only.
- API security headers are configured through Next.js headers().
- Dashboard/order/review/customer query indexes are represented in Prisma schema and migration.
```

Remaining owner decision:

```txt
The in-process rate limiter is suitable as a zero-dependency baseline and testable guardrail. For multi-instance production strictness, replace the store with a durable shared backend such as Vercel KV/Upstash before high traffic.
```

## Open Decisions

- [ ] Vercel team/account owner.
- [ ] GitHub repository URL.
- [ ] Production branch name.
- [ ] Production domain.
- [ ] Preview database strategy.
- [ ] Preview payment instruction policy.
- [ ] Admin owner responsible for Vercel env var changes.
- [ ] Backup owner for Vercel access.

## Production Launch Gate

Production remains blocked until all owners mark these complete:

| Gate | Owner | Status |
| --- | --- | --- |
| Local checks pass: lint, typecheck, test, db:validate, build | Engineering | Passed locally on 2026-05-28 |
| Local master pushed to remote master | Engineering/Maintainer | Pending |
| CI green on remote master or pull request | Engineering/Maintainer | Pending |
| Vercel project connected to correct GitHub repository | Maintainer | Pending |
| Preview and Production env vars are separated | Maintainer | Pending |
| Disposable CockroachDB migration deploy passes | Engineering/Maintainer | Pending safe DB |
| Preview smoke checklist passes | Engineering/Maintainer | Pending Preview URL |
| Owner confirms payment, delivery, admin, email, and R2 values | Sunflour owner/Maintainer | Pending |
| Production backup/restore owner confirmed | Maintainer | Pending |
| Final owner launch approval | Sunflour owner | Pending |
