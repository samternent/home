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

## PixPax v3 compact signed redeem (token-only)

PixPax v3 redeem uses compact ECDSA P-256 signed handle tokens:

- token format: `<payloadB64Url>.<signatureB64Url>`
- payload bytes are canonical JSON bytes from `canonicalStringify`
- signature bytes are raw 64-byte ECDSA (`r||s`)
- payload schema: `{ v: 3, k: "<issuerKid>", c: "<codeId>", e: <expEpochSeconds> }`
- redeem policy is resolved server-side from `codeId` lookup records (`__codes/<codeId>.json`)
- non-v3 tokens are rejected with `legacy_token_unsupported`

### Endpoints

- `POST /v1/pixpax/redeem`
  - request: `{ token, collectorPubKey, collectorSig? }`
  - token-only contract: alias/code fields are rejected
- `POST /v1/pixpax/collections/:collectionId/:version/override-codes` (admin)
  - mints one signed **code token** (path name retained for compatibility)
  - response includes `label`, `redeemUrl`, `qrSvg`, `qrErrorCorrection`, `qrQuietZoneModules`
- `POST /v1/pixpax/collections/:collectionId/:version/code-cards` (admin)
  - request supports `kind`, `quantity`, `cardId|count`, `dropId?`, `expiresInSeconds?`, `wave?`, `format?`
  - returns canonical `items[]` with `{ token, redeemUrl, qrSvg, ... }` for frontend print rendering
  - `format` currently supports `json` only
- `GET /v1/pixpax/redeem-code/:codeId`
  - resolves short redeem `codeId` to a signed token
- `GET /v1/pixpax/issuers`
  - returns active issuer keys including compact key reference `kid`
- `GET /v1/pixpax/issuers/:issuerKeyId`
- `GET /v1/pixpax/receipt-keys`
- `GET /v1/pixpax/receipt-keys/:receiptKeyId`
- `GET /v1/pixpax/collections/:collectionId/resolve`
  - deterministic collection routing response:
    - `collectionId`
    - `resolvedVersion`
    - `settings`
    - `issuer` display metadata
- `GET /v1/pixpax/collections/:collectionId/settings`
- `PUT /v1/pixpax/collections/:collectionId/settings` (admin)
- `GET /v1/pixpax/collections/catalog` (public-only listing)

### Collection settings model

Collection behavior settings are mutable and stored at collection scope:

- `pixpax/collections/<collectionId>/settings.json`

Known enum fields:

- `visibility`: `public | unlisted`
- `issuanceMode`: `scheduled | codes-only`

Validation policy:

- known enum values are strictly validated
- unknown keys are allowed and preserved (forward compatible)

Catalog/listing behavior:

- `/catalog` returns only collections with `visibility="public"`
- collector collection pages resolve via `/resolve` and then load versioned bundle content

### Code token QR redirect

Printed/mobile QR links default to short lookup path:

- `https://pixpax.xyz/r/<codeId>`

Compat route is also supported:

- `https://pixpax.xyz/r?t=<token>`

Both redirect to canonical redeem URL:

- `/pixpax/redeem?token=<token>`

Set `PIX_PAX_QR_BASE_URL` to override the default QR base URL.

### Canonical signing rules

Use concord canonical JSON helpers for all signed/hashed payloads:

- compact token payload bytes (`{v,k,c,e}`)
- receipt payload bytes
- `tokenHash` (`sha256(canonical-token-payload-bytes)`)
- `policyHash`

Do not use `JSON.stringify` for signed/hash inputs.

### Separate signing keys

- Issuer key signs token payloads.
- Receipt key signs redemption receipts.
- Receipt signing must not reuse issuer private key.

Required receipt signing env vars:

- `PIX_PAX_RECEIPT_PRIVATE_KEY_PEM` (required for redeem)
- `PIX_PAX_RECEIPT_KEY_ID` (optional; derived from receipt public key if missing)
- `PIX_PAX_RECEIPT_PUBLIC_KEY_PEM` (optional; derived from private key if missing)

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
- `AUTH_PASSKEY_RP_ID` (required when frontend origin differs from `AUTH_BASE_URL` host)
- `AUTH_PASSKEY_RP_NAME` (optional; defaults to `Ternent`)
- `AUTH_PASSKEY_ORIGINS` (optional comma-separated exact origins for WebAuthn)
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

For operator DB client/tunnel workflow (dev + prod), see:

- `.ops/ternent-api/DB_ACCESS.md`

Migration files:

- `apps/ternent-api/data/migrations/*.sql`

Accounts v2 migration tooling:

- `pnpm --filter ternent-api accounts:v2:recon`
- `pnpm --filter ternent-api accounts:v2:backfill`
- `pnpm --filter ternent-api accounts:v2:verify`
- `apps/ternent-api/MIGRATION.md`

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
