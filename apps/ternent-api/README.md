# ternent-api

## PixPax issuer audit ledger

`/v1/stickerbook/issue` writes a signed `pack.issued` Concord entry to an append-only
issuer ledger in DigitalOcean Spaces (S3-compatible).

Ledger guarantees:
- append-only segments (`.jsonl.gz`) with `prevSegmentHash` + `prevSegmentKey`
- content-addressed segment key (`seg_<sha256>.jsonl.gz`)
- fixed minimal checkpoint pointer (`checkpoint.json`)
- signed Concord entry per issuance (`issuerKeyId` supports key rotation)
- no secrets persisted in ledger events (`serverSecret`, `clientNonce`, `packSeed` excluded)

### Hash input definition

Segment hash is always:
- `sha256(uncompressed-jsonl-utf8-bytes)`

This hash is used for:
- `seg_<sha256>.jsonl.gz` file key naming
- `checkpoint.headSegmentHash`
- `segment.meta.prevSegmentHash` chaining

### Bucket layout

- `<LEDGER_PREFIX>/checkpoint.json`
- `<LEDGER_PREFIX>/segments/YYYY-MM-DD/seg_<sha256>.jsonl.gz`

### Required environment variables

- `ISSUER_PRIVATE_KEY_PEM`
- `LEDGER_S3_ENDPOINT` (example: `https://lon1.digitaloceanspaces.com`)
- `LEDGER_BUCKET`
- `LEDGER_PREFIX` (example: `pixpax/ledger`)
- `LEDGER_ACCESS_KEY_ID`
- `LEDGER_SECRET_ACCESS_KEY`
- `LEDGER_REGION` (example: `lon1`)

Optional:
- `ISSUER_KEY_ID`
- `LEDGER_FLUSH_MAX_EVENTS` (default `200`)
- `LEDGER_FLUSH_INTERVAL_MS` (default `60000`)
- `LEDGER_FLUSH_SYNC_ON_ISSUE` (default `false`; set `true` for immediate durability per issuance)
- `LEDGER_RECORD_DEV_ISSUES` (default `false`; in non-production, skip ledger writes unless explicitly `true`)
- `LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON`
- `LEDGER_S3_FORCE_PATH_STYLE` (`true` by default)

### Trusted issuer keys JSON schema (strict)

`LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON` must be:

```json
[
  {
    "keyId": "<64-char sha256 hex fingerprint>",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----\\n"
  }
]
```

Validation rules:
- value must be valid JSON
- top-level must be an array
- each element must include `keyId` and `publicKeyPem`
- `keyId` must exactly match `sha256(publicKeyPem normalized)`

Invalid shape fails startup.

### Verify a receipt

Endpoint:
- `GET /v1/pixpax/receipt/:packId?segmentKey=<key>`

CLI:
```bash
pnpm pixpax:verify -- --packId <pack-id> --segmentKey <segment-key>
```

Derive issuer key formats from `ISSUER_PRIVATE_KEY_PEM`:
```bash
pnpm pixpax:derive-issuer-key-formats -- --env-file .ops/ternent-api/.env
```

Verifier checks:
- segment key hash matches segment content hash
- checkpoint head consistency
- parent chain (`prevSegmentHash`/`prevSegmentKey`)
- entry signature against trusted issuer keys

### Kubernetes secret mapping

Deployment uses explicit `env` + `secretKeyRef` (not `envFrom`).

Secret `ternent-api-ledger` key mapping:
- `ledger-s3-endpoint` -> `LEDGER_S3_ENDPOINT`
- `ledger-bucket` -> `LEDGER_BUCKET`
- `ledger-prefix` -> `LEDGER_PREFIX`
- `ledger-access-key-id` -> `LEDGER_ACCESS_KEY_ID`
- `ledger-secret-access-key` -> `LEDGER_SECRET_ACCESS_KEY`
- `ledger-region` -> `LEDGER_REGION`
- `ledger-flush-max-events` -> `LEDGER_FLUSH_MAX_EVENTS`
- `ledger-flush-interval-ms` -> `LEDGER_FLUSH_INTERVAL_MS`
- `ledger-flush-sync-on-issue` -> `LEDGER_FLUSH_SYNC_ON_ISSUE`
- `ledger-record-dev-issues` -> `LEDGER_RECORD_DEV_ISSUES`
- `ledger-trusted-issuer-public-keys-json` -> `LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON`
- `issuer-key-id` -> `ISSUER_KEY_ID`

Reference file: `.ops/ternent-api/secret-ledger.example.yaml`.

PixPax content/admin env mapping is configured directly in:
- `.ops/ternent-api/deployment.yaml`

### Single writer requirement

Issuer ledger is fork-sensitive. Deploy issuer service with exactly one replica:
- `.ops/ternent-api/deployment.yaml` sets `spec.replicas: 1`

### Graceful shutdown

On `SIGTERM`/`SIGINT`, the service flushes pending ledger events before exiting.

## PixPax album model docs

Curated album model (Model 1), example payloads, and curl flows:

- `docs/pixpax-album-model.md`

## Platform auth (Better Auth)

Ternent platform auth now lives in `ternent-api` and is app-agnostic.

- Auth base route: `/v1/auth/*`
- Account/workspace route: `/v1/account/*`
- PixPax can consume platform capabilities via shared middleware.

### Required environment variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_BASE_URL`

Recommended:

- `AUTH_TRUSTED_ORIGINS` (comma-separated)
- `CORS_ALLOW_ORIGINS` (comma-separated)
- `AUTH_SESSION_IDLE_SECONDS`
- `AUTH_SESSION_ROLLING_SECONDS`

Email OTP fallback (optional, but recommended):

- `RESEND_API_KEY`
- `RESEND_FROM`
- `RESEND_REPLY_TO` (optional)
- `RESEND_API_BASE` (optional; defaults to `https://api.resend.com`)

SMTP alternative (optional):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Delivery order: Resend first (if configured), otherwise SMTP, otherwise OTP code fallback in API logs.

### Database migrations

Run:

```bash
pnpm --filter ternent-api platform:migrate
```

Migration files:

- `apps/ternent-api/data/migrations/*.sql`

### Notes

- Better Auth dependencies must be installed in `ternent-api`.
- If auth dependencies or env vars are missing, auth/account routes fail closed with `503`.

## Cheap Postgres profile (existing cluster)

Low-cost manifests live under:

- `.ops/postgres/*`

This profile uses:

- single Postgres StatefulSet (`postgres:17`)
- one 20Gi PVC
- WAL-G archiving to Spaces
- nightly backup cron
- weekly restore-drill cron (backup inventory validation baseline)

See:

- `.ops/postgres/README.md`
