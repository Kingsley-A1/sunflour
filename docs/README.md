# Sunflour Bakery — Documentation Index

This folder is the documentation home for the Sunflour Bakery platform. Start with
the document that matches who you are.

## 👤 For the business owner

- **[OWNERS_GUIDE.md](./OWNERS_GUIDE.md)** — the complete, plain-language guide to
  running the platform: orders, payments, delivery, reviews, your team, going live,
  recovery, and day-to-day operations. _(Open in any Markdown reader, or
  Print → Save as PDF for a handout.)_

## 🛠️ For developers

Read these in order:

1. **[../AGENTS.md](../AGENTS.md)** — the operating contract (rules, product
   constraints, what to read for each task type). **Required reading.**
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the technical single source of truth:
   stack, layering, directories, domains, auth/RBAC, design system, SEO, config,
   and the definition of done.

Then the reference docs for the area you're touching:

| Topic | Document |
| --- | --- |
| API endpoints & envelope | [api-contracts.md](./api-contracts.md) |
| Database schema | [database-schema.md](./database-schema.md) |
| Order & payment lifecycle | [order-lifecycle.md](./order-lifecycle.md) |
| Design tokens & UI rules | [design-system.md](./design-system.md) |
| Component contracts | [component-contracts.md](./component-contracts.md) |
| Public/admin routes | [frontend-routes.md](./frontend-routes.md) |
| Testing & DB strategy | [test-database-strategy.md](./test-database-strategy.md) |
| Deployment (Vercel) | [vercel-deployment.md](./vercel-deployment.md) |

## 📐 Product/implementation references (repo root)

- [../backend-implementation.md](../backend-implementation.md),
  [../backend-implimenetation-2.0.md](../backend-implimenetation-2.0.md)
- [../frontend-implimentation.md](../frontend-implimentation.md),
  [../frontend-implimentation-2.0.md](../frontend-implimentation-2.0.md)

## 🗄️ Archive

[`archive/`](./archive) holds historical, one-off material (old agent prompts and
the external design reference PDF). Kept for provenance; not maintained.

---

_Maintained alongside the codebase. If a document and the code disagree, fix one of
them — don't leave them out of sync._
