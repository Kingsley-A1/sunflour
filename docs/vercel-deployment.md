# Vercel Deployment Plan - Sunflour Bakery

Status: Phase 0 confirmation document. This repository is not currently linked to a Vercel project in local files.

## Current Local Evidence

Checked on 2026-05-27:

```txt
.vercel/project.json: not present
vercel.json: not present
package.json: not present
Git metadata: not present in this workspace
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

## Open Decisions

- [ ] Vercel team/account owner.
- [ ] GitHub repository URL.
- [ ] Production branch name.
- [ ] Production domain.
- [ ] Preview database strategy.
- [ ] Preview payment instruction policy.
- [ ] Admin owner responsible for Vercel env var changes.
- [ ] Backup owner for Vercel access.
