# PixPax Custom Collection Guide (ternent-api + concord)

This guide documents how PixPax public collections are modeled and uploaded in this repo.

## Scope and source files

Primary implementation files:
- `apps/ternent-api/routes/pixpax/collections/index.mjs`
- `apps/ternent-api/routes/pixpax/collections/validation.mjs`
- `apps/ternent-api/routes/pixpax/collections/content-store.mjs`
- `apps/ternent-api/scripts/pixpax-generate-public-collection.mjs`
- `apps/ternent-api/scripts/pixpax-seed-collection.mjs`
- `apps/concord/src/route/pixpax/RoutePixPaxCollections.vue`
- `apps/concord/src/module/pixpax/sticker-types.ts`
- `apps/concord/src/module/pixpax/protocol.ts`

## Data model: collection, series, card

PixPax uses 3 JSON layers per collection version:

1. `collection.json` (collection-level metadata)
2. `index.json` (series list + card catalog + card-to-series mapping)
3. `cards/<cardId>.json` (per-card render/content payload)

The upload API stores these as immutable artifacts for a `(collectionId, version)` pair.

### What is a collection?

A collection is the top-level container for a themed set of cards.

Typical fields (only `gridSize` is strictly required by validation):

```json
{
  "collectionId": "premier-league-2026",
  "version": "v2",
  "name": "Premier League 2026",
  "description": "Public demo collection with 5 series and 50 cards.",
  "gridSize": 16,
  "createdAt": "2026-02-07T17:57:41.897Z",
  "palette": {
    "id": "premier-league-2026-default",
    "colors": [0, 4279308561, 4294967295, 4293870660, 4280468830, 4282090230, 4294286859, 4289222135, 4278630100, 4294538006, 4286893078, 4293675161, 4287323382, 4294299902, 4290438909, 4294829706]
  }
}
```

Rules:
- `gridSize` must be a positive integer (`16` for current idx4 card art protocol).
- `collectionId` and `version` are passed in URL path and should match body values if you include them.

### What is a series?

A series is a subgroup inside a collection (team/chapter/set/etc.).

Series live in `index.json -> series[]`.

```json
{
  "seriesId": "arsenal",
  "name": "Arsenal"
}
```

Rules:
- Each series entry must include a non-empty `seriesId`.
- `index.cardMap[cardId].seriesId` must reference one of these series IDs.

### What is a card?

A card is one collectible item in the catalog.

Card data appears in two places:

1. `index.json`
- `cards[]`: ordered list of all card IDs.
- `cardMap[cardId]`: index metadata for each card.

```json
{
  "seriesId": "arsenal",
  "slotIndex": 0,
  "role": "player"
}
```

2. `cards/<cardId>.json`
- render payload used by API responses and pack issuance hashing.

```json
{
  "cardId": "arsenal-01",
  "seriesId": "arsenal",
  "slotIndex": 0,
  "role": "player",
  "label": "Arsenal Player 01",
  "renderPayload": {
    "gridSize": 16,
    "gridB64": "AAAAAAAAAAAAAAAAAAAAAAAQYBBgEGAAAAFhAWEBYQAAEGAQYBBgAAABYQFhAWEAABBgEGAQYAAAAWERYQFhAAAQYBBgEGAAAAFhAWEBYQAAEGBmZhBgAAABYQFhAWEAABBgEGAQYAAAAWEBYQFhAAAAAAAAAAAAAAAAAAAAAAA="
  }
}
```

Card validation rules:
- Body must be JSON object.
- Optional `cardId` (if present) must match `:cardId` in URL.
- `renderPayload` required.
- `renderPayload.gridB64` required, non-empty string.
- `renderPayload.gridSize` required positive int and must equal `collection.gridSize`.

## Card art protocol in concord

Concord expects 16x16 indexed art:
- `v = 1`
- `w = 16`
- `h = 16`
- `fmt = "idx4"`
- `px = base64` of 128 packed bytes (2 pixels per byte, each 0..15).

Palette expectations in concord (`assertPalette16`):
- 16 entries.
- `colors[0] = 0x00000000` (transparent).
- `colors[1..15]` alpha channel must be `0xFF`.

## Required API endpoints for creating/uploading a collection

All write endpoints are admin-protected and require:
- `Authorization: Bearer <PIX_PAX_ADMIN_TOKEN>`

### 1) Upload collection metadata

`PUT /v1/pixpax/collections/:collectionId/:version/collection`

- Stores `collection.json`.
- Immutable: second write returns `409`.

### 2) Upload index

`PUT /v1/pixpax/collections/:collectionId/:version/index`

- Stores `index.json`.
- Immutable: second write returns `409`.

### 3) Upload every card

`PUT /v1/pixpax/collections/:collectionId/:version/cards/:cardId`

- Requires `collection.json` already exists for same version.
- Immutable per card ID.

### Read endpoints (public)

- `GET /v1/pixpax/collections/:collectionId/:version/collection`
- `GET /v1/pixpax/collections/:collectionId/:version/index`
- `GET /v1/pixpax/collections/:collectionId/:version/cards/:cardId`

## Pack issuance endpoints (after upload)

Not required for upload, but needed to use the collection:

### Issue/open a pack

`POST /v1/pixpax/collections/:collectionId/:version/packs`

Request (minimum):

```json
{
  "userKey": "public:demo-user"
}
```

Optional fields:
- `issuanceMode`: `"weekly"` (default) or `"dev-untracked"`
- `override`: `true` (admin override mode)
- `overrideCode`: one-time code string
- `dropId`: explicit drop cycle
- `count`: used with override mode/code (1..50)

Returns:
- `packId`, `cards[]`, ledger `entry`, receipt info, merkle/hash commitments, issuance mode metadata.

### Mint override codes (admin)

`POST /v1/pixpax/collections/:collectionId/:version/override-codes`

Used to generate one-time gift/redeem codes for extra packs.

## End-to-end workflow to create your own collection

## 1) Generate starter files

From repo root:

```bash
pnpm --filter ternent-api pixpax:generate-public -- \
  --outDir docs/pixpax-public-collections/my-collection/v1 \
  --collectionId my-collection \
  --version v1 \
  --seriesCount 4 \
  --cardsPerSeries 12 \
  --gridSize 16
```

This creates:
- `collection.json`
- `index.json`
- `cards/*.json`

## 2) Edit content

Customize files under:
- `docs/pixpax-public-collections/my-collection/v1/collection.json`
- `docs/pixpax-public-collections/my-collection/v1/index.json`
- `docs/pixpax-public-collections/my-collection/v1/cards/*.json`

Keep invariants:
- Every `index.cards[]` ID has exactly one `index.cardMap[cardId]` entry.
- No extra keys in `cardMap` beyond `index.cards[]`.
- `cardMap[].seriesId` exists in `series[]`.
- Each card file has `renderPayload.gridSize = 16` and non-empty `gridB64`.

## 3) Upload (seed) to ternent-api

```bash
pnpm --filter ternent-api pixpax:seed -- \
  --api http://localhost:3000 \
  --token "$PIX_PAX_ADMIN_TOKEN" \
  --collectionId my-collection \
  --version v1 \
  --dir docs/pixpax-public-collections/my-collection/v1 \
  --concurrency 8
```

Helpful flags:
- `--dry-run` (print requests only)
- `--skip-existing` (skip `409 already exists`)

Upload order performed by script:
1. `PUT .../collection`
2. `PUT .../index`
3. `PUT .../cards/:cardId` for each card file

## 4) Verify public reads

```bash
curl -sS http://localhost:3000/v1/pixpax/collections/my-collection/v1/collection
curl -sS http://localhost:3000/v1/pixpax/collections/my-collection/v1/index
curl -sS http://localhost:3000/v1/pixpax/collections/my-collection/v1/cards/<card-id>
```

## 5) Test issuing a pack

```bash
curl -sS -X POST "http://localhost:3000/v1/pixpax/collections/my-collection/v1/packs" \
  -H "Content-Type: application/json" \
  --data '{"userKey":"public:demo-user"}'
```

## Storage + env requirements (ternent-api)

Collection content storage is backed by S3-compatible object storage via `CollectionContentStore`.

Required environment variables:
- `LEDGER_S3_ENDPOINT`
- `LEDGER_CONTENT_BUCKET` (or `LEDGER_BUCKET`)
- `LEDGER_REGION`
- `LEDGER_ACCESS_KEY_ID`
- `LEDGER_SECRET_ACCESS_KEY`

Optional:
- `LEDGER_CONTENT_PREFIX` (default `pixpax/collections`)
- `LEDGER_S3_FORCE_PATH_STYLE` (default true)

Auth/config for admin and overrides:
- `PIX_PAX_ADMIN_TOKEN` (required for PUT/override admin endpoints)
- `PIX_PAX_OVERRIDE_CODE_SECRET` (required only for signed override code parsing/minting path)

## Concord frontend integration notes

`RoutePixPaxCollections.vue` loads data in this sequence:
1. GET `collection`
2. GET `index`
3. GET each `cards/:cardId`

Then maps API cards to concord `Sticker` shape:
- `sticker.meta.id = cardId`
- `sticker.meta.series = card.seriesId` (or index fallback)
- `sticker.art.px = card.renderPayload.gridB64`

So if your upload payloads conform to the API schemas above, Concord can render them without extra API changes.

## Common failure cases

- `401 Unauthorized` on PUT/override endpoints: missing/invalid bearer token.
- `409 already exists`: content is immutable for that path; bump `version` to republish.
- `404 collection.json must be uploaded first`: tried card upload before collection upload.
- `400 Invalid index payload`: cardMap/series/card consistency error.
- `400 Invalid card payload`: missing `renderPayload` or grid mismatch.
- `503 Content store configuration is incomplete`: missing `LEDGER_*` content-store env.

