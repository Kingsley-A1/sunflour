# Git Workflow — Sunflour Bakery

This is the single, standard branching contract for the Sunflour codebase. It
exists so that risky work is tested before it reaches production and so the repo
stays clean and easy to reason about. Built for honour and for excellence.

## 1. The only long-lived branches

There are exactly two permanent branches. Everything else is temporary.

| Branch     | Role                          | Deploys to        | Stability          |
| ---------- | ----------------------------- | ----------------- | ------------------ |
| `main`     | Source of truth / production  | Production        | Always releasable  |
| `master`   | Integration / testing (staging) | Preview/staging | May be in-progress |

- **`main`** is the production truth. It must always build, pass checks, and be
  safe to deploy. Nothing lands here until it has been tested.
- **`master`** is the staging/testing branch. Big or risky changes go here first
  so they can be exercised in a deployed preview environment before promotion.

Do not create other long-lived branches. Do not resurrect `claude/*`,
`archive/*`, or redesign branches — that history is already contained in `main`.

## 2. Where does my change go?

Decide by risk, not by size of the diff.

- **Small, low-risk, obviously-correct change** (copy tweak, token fix, isolated
  bug fix with a test): open a short-lived feature branch off `main`, get it
  green, and merge to `main` via PR.
- **Big change that needs real testing** (checkout/payment/order-lifecycle
  logic, schema/migrations, auth/RBAC, delivery/pricing rules, multi-file
  refactors, anything you want to click through in a deployed preview): land it
  on **`master`** first. Test it there. Only after it is verified do you promote
  it to `main`.

When in doubt, treat it as "big" and route through `master`.

## 3. Feature branches

Short-lived working branches are fine and encouraged. Naming:

```
feat/<short-scope>        e.g. feat/order-cancel-window
fix/<short-scope>         e.g. fix/email-cron-redirect
chore/<short-scope>       e.g. chore/git-workflow-doc
```

- Branch off the target integration branch (`main` for small work, `master` for
  big work).
- Keep them focused and short-lived. Delete them once merged.
- Never let a feature branch become a second long-lived line of development.

## 4. The promotion flow (big changes)

```
feat/*  ──►  master  ──►  (test in staging)  ──►  main
```

1. Build the change on a `feat/*` branch (or directly on `master` for tightly
   scoped staging work).
2. Merge into `master`. CI must be green.
3. Deploy/preview from `master` and actually exercise the affected journey:
   checkout, payment confirmation, order status, delivery fees, emails, etc.
4. When it is proven, promote `master` into `main` via PR. `main` should
   fast-forward or merge cleanly from `master`.
5. Keep `master` synchronised with `main` after every promotion so the two never
   drift (see §5).

## 5. Keeping `master` and `main` in sync

After anything merges to `main` (e.g. a small hotfix that went straight to
`main`), bring `master` back up to date so it is never behind production:

```bash
git fetch origin
git checkout master
git merge --ff-only origin/main   # or: git reset --hard origin/main if master has no unique work
git push origin master
```

`master` should always be `main` **plus** whatever is currently being tested —
never behind it.

## 6. Required checks before promoting to `main`

A change is not "done" and must not reach `main` until, where feasible:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All must pass (or any skip must be justified). See `AGENTS.md` §9 for the full
Definition of Done. Payment, order-lifecycle, delivery-fee, and RBAC changes
always warrant tests.

## 7. Commit hygiene

- Use `pnpm` only. Never commit `package-lock.json`, `yarn.lock`, or `bun.lockb`.
- Never commit `.env` files or secrets.
- Write clear, scoped commits: `feat(orders): ...`, `fix(ci): ...`,
  `chore(git): ...`.
- Prefer new commits over rewriting shared history on `main`/`master`.

## 8. Do not

- Do not push directly to `main` without the change having been tested.
- Do not force-push `main` or `master`.
- Do not open new permanent branches.
- Do not merge red (failing-CI) branches into `main`.
- Do not trust a big change on `main` that never passed through `master`.

---

Discipline here keeps production trustworthy for the bakery and its customers.
Test on `master`, ship from `main`.
