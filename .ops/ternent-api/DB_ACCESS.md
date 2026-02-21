# DB Client Access (Dev + Prod)

Use `.ops/ternent-api/db-access.sh` to connect with `psql` or external DB clients (TablePlus, DBeaver, Postico).

## 1) Start tunnel

Prod:

```bash
.ops/ternent-api/db-access.sh tunnel prod --port 15432
```

Dev:

```bash
.ops/ternent-api/db-access.sh tunnel dev --port 15433
```

## 2) Get client URL

Prod (localhost-rewritten URL for tunnel):

```bash
.ops/ternent-api/db-access.sh url prod --port 15432
```

Dev:

```bash
.ops/ternent-api/db-access.sh url dev --port 15433
```

Paste that URL directly into your SQL client.

## 3) Run migrations

Through tunnel:

```bash
.ops/ternent-api/db-access.sh migrate prod --port 15432
.ops/ternent-api/db-access.sh migrate dev --port 15433
```

Direct (only if your machine can reach DB host directly):

```bash
.ops/ternent-api/db-access.sh migrate prod --direct
.ops/ternent-api/db-access.sh migrate dev --direct
```

## 4) Open interactive psql

```bash
.ops/ternent-api/db-access.sh psql prod --port 15432
.ops/ternent-api/db-access.sh psql dev --port 15433
```

## Config overrides

Set custom URLs directly:

- `DB_PROD_URL`
- `DB_DEV_URL`

Or set K8s/secret selectors:

- `DB_PROD_K8S_CONTEXT`
- `DB_PROD_K8S_NAMESPACE`
- `DB_PROD_K8S_SERVICE`
- `DB_PROD_K8S_SECRET`
- `DB_PROD_K8S_SECRET_KEY`
- `DB_DEV_K8S_CONTEXT`
- `DB_DEV_K8S_NAMESPACE`
- `DB_DEV_K8S_SERVICE`
- `DB_DEV_K8S_SECRET`
- `DB_DEV_K8S_SECRET_KEY`

Dev can also load `DATABASE_URL` from:

- `DB_DEV_ENV_FILE` (default: `.ops/ternent-api/.env.local`)

## Safety recommendation

- Keep separate client entries for `dev` and `prod`.
- Use migration workflow from code (`platform:migrate`) instead of manual schema edits in prod.
- Prefer least-privilege DB roles for normal app traffic; reserve DDL-capable role for migration operations.
