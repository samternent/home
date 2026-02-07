# PixPax Album Model (Model 1)

This document defines the curated/completable album flow for PixPax.

## Model summary

- `packModel`: `album`
- Collection: league (example `premier-league-2026`)
- Series: team page
- Card: player slot
- Pack selection: uniform random from full collection card list, with replacement
- Album completion state: client-side only (private pixbook), no server DB state

## Storage layout in Spaces

Content objects are immutable by version path.

- `LEDGER_CONTENT_PREFIX/<collectionId>/<version>/collection.json`
- `LEDGER_CONTENT_PREFIX/<collectionId>/<version>/index.json`
- `LEDGER_CONTENT_PREFIX/<collectionId>/<version>/cards/<cardId>.json`

Example default prefix:

- `pixpax/collections/premier-league-2026/v2/collection.json`

## API endpoints

Admin (token required via `Authorization: Bearer <PIX_PAX_ADMIN_TOKEN>`):

- `PUT /v1/pixpax/collections/:collectionId/:version/collection`
- `PUT /v1/pixpax/collections/:collectionId/:version/index`
- `PUT /v1/pixpax/collections/:collectionId/:version/cards/:cardId`

Pack issuance:

- `POST /v1/pixpax/collections/:collectionId/:version/packs`

Request:

```json
{
  "userKey": "school:user:abc123",
  "count": 5,
  "dropId": "week-2026-W06"
}
```

Response:

```json
{
  "packId": "f7a7f7f4b1f0e33c7d4f77b9",
  "packModel": "album",
  "collectionId": "premier-league-2026",
  "collectionVersion": "v2",
  "dropId": "week-2026-W06",
  "issuedAt": "2026-02-07T12:00:00.000Z",
  "cards": [
    {
      "cardId": "arsenal-01",
      "seriesId": "arsenal",
      "slotIndex": 0,
      "role": "player",
      "renderPayload": { "gridSize": 16, "gridB64": "AAECAwQFBgcICQ==" }
    }
  ],
  "receipt": {
    "segmentKey": "pixpax/ledger/segments/2026-02-07/seg_<hash>.jsonl.gz",
    "segmentHash": "<hash>"
  },
  "packRoot": "<hex>",
  "itemHashes": ["<hex>"]
}
```

## Canonical card hashing

Each card hash is derived from canonical JSON bytes (UTF-8):

```json
{
  "v": 1,
  "packModel": "album",
  "collectionId": "premier-league-2026",
  "collectionVersion": "v2",
  "cardId": "arsenal-01",
  "renderPayload": {
    "gridSize": 16,
    "gridB64": "AAECAwQFBgcICQ=="
  }
}
```

Rules:

- Include stable rendering fields only.
- Exclude labels/names/descriptions from hash input.
- Include `renderPayload.palette` only when it is an actual render input.

Then:

- `itemHash = sha256(utf8(JSON.stringify(canonicalObj)))`
- `packRoot = merkle(itemHashes)` using the same pairwise hash strategy as existing stickerbook packs.

## Ledger payload rules

`pack.issued` for album packs includes:

- `packModel: "album"`
- `collectionId`, `collectionVersion`
- `cardIds[]`, `itemHashes[]`, `packRoot`

Privacy:

- `issuedTo` is hashed (`sha256("pixpax:user:" + canonicalUserKey)`).
- No raw `userKey` in ledger payload.
- No full card payloads in ledger payload.

## Environment variables

Reuse existing ledger S3 connection env vars:

- `LEDGER_S3_ENDPOINT`
- `LEDGER_REGION`
- `LEDGER_ACCESS_KEY_ID`
- `LEDGER_SECRET_ACCESS_KEY`
- `LEDGER_S3_FORCE_PATH_STYLE` (optional)

Content-specific vars:

- `LEDGER_CONTENT_PREFIX` (default `pixpax/collections`)
- `LEDGER_CONTENT_BUCKET` (optional; falls back to `LEDGER_BUCKET`)
- `PIX_PAX_ADMIN_TOKEN` (required for admin upload endpoints)

Ledger write/receipt flags:

- `LEDGER_RECORD_DEV_ISSUES`
- `LEDGER_FLUSH_SYNC_ON_ISSUE`
- `LEDGER_FLUSH_INTERVAL_MS`
- `LEDGER_FLUSH_MAX_EVENTS`

## Ledger flush settings (dev vs prod)

Local/dev recommended:

- `LEDGER_RECORD_DEV_ISSUES=true`
- `LEDGER_FLUSH_SYNC_ON_ISSUE=true`

Rationale: every issue request flushes immediately, so receipt response includes
`segmentKey` and `segmentHash` reliably during local testing.

Production recommended (early-safe default):

- `LEDGER_FLUSH_SYNC_ON_ISSUE=true`

Rationale: simpler operational behavior and immediate receipt refs.
Throughput optimization with async flush can be added later once client/server
handling of pending receipts is explicitly implemented.

## Kubernetes wiring templates

Added examples:

- `.ops/ternent-api/secret-pixpax-content.example.yaml`
- `.ops/ternent-api/deployment-env-patch-pixpax-content.example.yaml`

Secret keys used:

- `pix-pax-admin-token` -> `PIX_PAX_ADMIN_TOKEN`
- `ledger-content-prefix` -> `LEDGER_CONTENT_PREFIX`
- `ledger-content-bucket` -> `LEDGER_CONTENT_BUCKET` (optional)

## Curl examples

Upload collection:

```bash
curl -X PUT "http://localhost:3000/v1/pixpax/collections/premier-league-2026/v2/collection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PIX_PAX_ADMIN_TOKEN" \
  --data @docs/pixpax-album-examples/collection.json
```

Upload index:

```bash
curl -X PUT "http://localhost:3000/v1/pixpax/collections/premier-league-2026/v2/index" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PIX_PAX_ADMIN_TOKEN" \
  --data @docs/pixpax-album-examples/index.json
```

Upload one card:

```bash
curl -X PUT "http://localhost:3000/v1/pixpax/collections/premier-league-2026/v2/cards/arsenal-01" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PIX_PAX_ADMIN_TOKEN" \
  --data @docs/pixpax-album-examples/cards/arsenal-01.json
```

Issue album pack:

```bash
curl -X POST "http://localhost:3000/v1/pixpax/collections/premier-league-2026/v2/packs" \
  -H "Content-Type: application/json" \
  --data '{"userKey":"school:user:abc123","dropId":"week-2026-W06"}'
```

Notes:

- standard issuance is one pack per `userKey + dropId` (idempotent)
- standard pack size is fixed to 5 cards (server-enforced)
- response includes `issuance.mode` and `issuance.reused`

Mint one-time override code (admin):

```bash
curl -X POST "http://localhost:3000/v1/pixpax/collections/premier-league-2026/v2/override-codes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PIX_PAX_ADMIN_TOKEN" \
  --data '{"userKey":"school:user:abc123","dropId":"week-2026-W06","count":8,"expiresInSeconds":86400}'
```

Response includes:

- `giftCode`: short human code (`PPX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`) for sharing/redeem UI
- `code`: legacy signed token (still accepted by server)

Gift mode (not bound to a specific user):

```bash
curl -X POST "http://localhost:3000/v1/pixpax/collections/premier-league-2026/v2/override-codes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PIX_PAX_ADMIN_TOKEN" \
  --data '{"bindToUser":false,"dropId":"week-2026-W06","count":8,"expiresInSeconds":86400}'
```

Redeem override code once:

```bash
curl -X POST "http://localhost:3000/v1/pixpax/collections/premier-league-2026/v2/packs" \
  -H "Content-Type: application/json" \
  --data '{"userKey":"school:user:abc123","overrideCode":"<giftCode-or-code-from-admin-endpoint>"}'
```

Verify receipt (existing endpoint):

```bash
curl "http://localhost:3000/v1/pixpax/receipt/<packId>?segmentKey=<segmentKey>"
```

## Seeding with script

Script:

- `apps/ternent-api/scripts/pixpax-seed-collection.mjs`
- `apps/ternent-api/scripts/pixpax-generate-public-collection.mjs`
- npm script alias: `pnpm pixpax:seed -- ...`

Input folder format:

- `<dir>/collection.json`
- `<dir>/index.json`
- `<dir>/cards/*.json`

CLI options:

- `--api <baseUrl>` (default `http://localhost:3000`)
- `--token <adminToken>` (or `PIX_PAX_ADMIN_TOKEN`)
- `--collectionId <id>`
- `--version <version>`
- `--dir <path>`
- `--dry-run`
- `--concurrency <n>` (default `4`)
- `--skip-existing` (treat 409 conflicts as success)

Example:

```bash
pnpm --filter ternent-api pixpax:generate-public -- \
  --outDir ../../docs/pixpax-public-collections/premier-league-2026/v2 \
  --collectionId premier-league-2026 \
  --version v2 \
  --seriesCount 5 \
  --cardsPerSeries 10

pnpm --filter ternent-api pixpax:seed -- \
  --api http://localhost:3000 \
  --token "$PIX_PAX_ADMIN_TOKEN" \
  --collectionId premier-league-2026 \
  --version v2 \
  --dir ../../docs/pixpax-public-collections/premier-league-2026/v2 \
  --skip-existing
```

Dry-run:

```bash
pnpm --filter ternent-api pixpax:seed -- \
  --api http://localhost:3000 \
  --token "$PIX_PAX_ADMIN_TOKEN" \
  --collectionId premier-league-2026 \
  --version v2 \
  --dir ../../docs/pixpax-public-collections/premier-league-2026/v2 \
  --dry-run
```

Concord route config (to load this collection in `/pixpax/collections`):

```bash
VITE_PIXPAX_PUBLIC_COLLECTIONS='[{"collectionId":"premier-league-2026","version":"v2"}]'
```

Verification workflow after seeding:

1. Issue pack via `POST /v1/pixpax/collections/:collectionId/:version/packs`
2. Read `receipt.segmentKey` + `receipt.segmentHash`
3. Verify via `GET /v1/pixpax/receipt/:packId?segmentKey=<segmentKey>`
