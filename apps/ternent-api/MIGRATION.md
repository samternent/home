# Accounts V2 Migration Runbook

## Scope
This migration introduces a new account-scoped schema while keeping legacy `platform_*` tables in place until final cleanup.

Stages implemented:

1. Stage A: new schema migrations (`accounts`, `account_members`, `identities`, `pixbooks`, `pixbook_snapshots`, `audit_events`)
2. Stage B: idempotent backfill script with JSON report
3. Stage C: read switch via feature flags
4. Stage D/E: dual-write cutover via feature flags
5. Stage G: verification script (counts, integrity, sample reads, reconciliation)
6. Stage F prep: manual legacy archive SQL (not auto-run)

## Prerequisites

1. `DATABASE_URL` points to target Postgres.
2. Existing migrations through `0004_platform_books_collection.sql` are already applied.
3. BetterAuth runtime env vars are set (`AUTH_SECRET`, `AUTH_BASE_URL`, `DATABASE_URL`).

## Flags

Set in environment (or deployment secrets):

- `ACCOUNT_SCHEMA_V2_READS=false`
- `ACCOUNT_SCHEMA_V2_WRITES=false`
- `ACCOUNT_SCHEMA_V2_DUAL_WRITE=false`
- `ACCOUNT_API_ACCEPT_WORKSPACE_ALIAS=true`

Behavior:

- `READS=true`: read account routes from v2 tables.
- `WRITES=true`: write account routes to v2 tables.
- `DUAL_WRITE=true`: mirror writes to the non-primary schema.
- `ACCOUNT_API_ACCEPT_WORKSPACE_ALIAS=true`: accept `workspaceId` as alias for `accountId` (one-release compatibility bridge).
- If read and write schemas differ, the switch layer also mirrors writes to the current read schema for read-after-write consistency.

## Step-by-step

### 1. Apply schema migration (Stage A)

```bash
pnpm --filter ternent-api platform:migrate
```

This applies `apps/ternent-api/data/migrations/0005_accounts_v2_schema.sql`.

### 2. Recon source schema (Stage 0)

```bash
pnpm --filter ternent-api accounts:v2:recon
```

Report path example:

- `/tmp/accounts-v2-recon-2026-02-23T...json`

### 3. Run backfill (Stage B)

```bash
pnpm --filter ternent-api accounts:v2:backfill
```

Report path example:

- `/tmp/accounts-v2-backfill-report-2026-02-23T...json`

Backfill is idempotent and safe to re-run.

### 4. Verify migrated state (Stage G)

```bash
pnpm --filter ternent-api accounts:v2:verify
```

This runs reconciliation checks too (`--reconcile`).

Report path example:

- `/tmp/accounts-v2-verify-report-2026-02-23T...json`

### 5. Enable v2 reads (Stage C)

Set:

- `ACCOUNT_SCHEMA_V2_READS=true`
- `ACCOUNT_SCHEMA_V2_WRITES=false`
- `ACCOUNT_SCHEMA_V2_DUAL_WRITE=false`

Deploy and validate account endpoints.

Optional authenticated API validation:

```bash
pnpm --filter ternent-api accounts:v2:verify-reads -- \
  --api http://localhost:3000 \
  --cookie "<better-auth-session-cookie>"
```

### 6. Enable dual-write (Stage D)

Set:

- `ACCOUNT_SCHEMA_V2_READS=true`
- `ACCOUNT_SCHEMA_V2_WRITES=false`
- `ACCOUNT_SCHEMA_V2_DUAL_WRITE=true`

Keep reads on v2 while writes remain primary on v1 with v2 mirror writes.

### 7. Write cutover (Stage E)

Set:

- `ACCOUNT_SCHEMA_V2_READS=true`
- `ACCOUNT_SCHEMA_V2_WRITES=true`
- `ACCOUNT_SCHEMA_V2_DUAL_WRITE=true`

After confidence period, disable dual-write:

- `ACCOUNT_SCHEMA_V2_DUAL_WRITE=false`

## Promotion matrix

- Stage A/B: `READS=false`, `WRITES=false`, `DUAL_WRITE=false`
- Stage C: `READS=true`, `WRITES=false`, `DUAL_WRITE=false`
- Stage D: `READS=true`, `WRITES=false`, `DUAL_WRITE=true`
- Stage E initial: `READS=true`, `WRITES=true`, `DUAL_WRITE=true`
- Stage E steady state: `READS=true`, `WRITES=true`, `DUAL_WRITE=false`

## API compatibility bridge

For one release:

1. Requests can send `accountId` (preferred) or `workspaceId` (alias).
2. Responses include both `accountId` and `workspaceId` (same value).

## Rollback

### Before write cutover

1. Set `ACCOUNT_SCHEMA_V2_READS=false` to return reads to v1.
2. Optionally set `ACCOUNT_SCHEMA_V2_DUAL_WRITE=false`.
3. Keep v2 tables intact.

### After write cutover

1. Set `ACCOUNT_SCHEMA_V2_WRITES=false` to resume primary writes on v1.
2. Keep `ACCOUNT_SCHEMA_V2_DUAL_WRITE=true` if you want mirrored catch-up.
3. Re-run `accounts:v2:verify` to confirm parity.

### Never do during rollback

- Do not run legacy archive migration.
- Do not drop any `platform_*` tables.

## Final cleanup (Stage F, manual)

Prepared SQL:

- `apps/ternent-api/data/migrations/manual/0009_legacy_archive_platform_tables.sql`

This migration moves `platform_*` tables to `legacy` schema and renames them with `_legacy` suffix.

It is intentionally **not** auto-run by `platform:migrate`.

Run only after:

1. v2 reads+writes are stable
2. verification passes consistently
3. rollback window is closed

Manual run example:

```bash
psql "$DATABASE_URL" -f apps/ternent-api/data/migrations/manual/0009_legacy_archive_platform_tables.sql
```

## Report interpretation

- `accounts:v2:backfill`: `errors.length` must be `0` for clean migration.
- `accounts:v2:verify`: all checks must show `PASS`.
- Any `count` mismatch or integrity check failure blocks cutover.
