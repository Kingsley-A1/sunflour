# Test Database Strategy - Sunflour Bakery

Status: Phase 1 backend foundation document.

## Goal

Database tests must prove Prisma can connect to CockroachDB without making the default unit test suite depend on a live database. Fast unit tests run on every machine. Database integration tests run only when a maintainer provides a safe test database URL.

## Environment Variables

```txt
DATABASE_URL
TEST_DATABASE_URL
SHADOW_DATABASE_URL
RUN_DB_TESTS
```

Default local and CI behavior keeps `RUN_DB_TESTS=false`, so database integration tests are skipped. To run database checks, set:

```bash
RUN_DB_TESTS=true
DATABASE_URL="<cockroachdb test connection string>"
```

Use a test database, not production. Never commit `.env` files.

Use `SHADOW_DATABASE_URL` for Prisma migration diff/development workflows that need to compare migration history against the current schema. The shadow database must be disposable.

## Scripts

```bash
pnpm db:generate
pnpm db:validate
pnpm db:migrate:dev
pnpm db:migrate:deploy
pnpm db:health
pnpm prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code
pnpm test
```

`pnpm db:generate` and `pnpm db:validate` do not require a live database. Migration and health scripts require `DATABASE_URL` and fail fast when it is missing.

## CI Expectation

Phase 1 CI can run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:validate
```

After CockroachDB test infrastructure exists, CI should add:

```bash
RUN_DB_TESTS=true pnpm test
pnpm db:migrate:deploy
pnpm db:health
```

The production database must never be used for test runs.
