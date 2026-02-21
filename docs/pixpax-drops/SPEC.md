# SPEC — PixPax Drops (ECDSA-only)

## 0. Definitions
- **Issuer**: entity that generates codes (platform, parent, event).
- **Collector**: device identity redeeming codes.
- **Code**: signed voucher authorizing a mint.
- **Receipt**: server-signed proof that a mint occurred.
- **Wave**: additional batch/run of codes for the same card (metadata only).

## 1. Code token format (v2)
Token:  
`<payloadB64Url>.<sigB64Url>`

- `payloadB64Url` = base64url(JSON bytes)
- `sigB64Url` = base64url(signature bytes (DER or raw, pick one and document))
- Signature algorithm: ECDSA P-256 with SHA-256

Recommendation: use DER for interoperability unless you already have raw utilities.

## 2. Payload schema (v2)
Required:
- `v`: 2
- `issuerKeyId`: string
- `codeId`: string (uuid/ulid)
- `collectionId`: string
- `version`: string (e.g. "v2")
- `kind`: "pack" | "fixed-card"

Optional common:
- `dropId`: string
- `exp`: number (epoch seconds)
- `wave`: number (metadata only)
- `policyHash`: string (sha256 of policy object; optional now, useful later)

Pack-only:
- `count`: number

Fixed-card only:
- `cardId`: string (required when kind="fixed-card")

Invariants:
- If `kind="fixed-card"`, mint exactly one instance of `cardId`.
- A code redeems at most once (canonical server check).

## 3. Issuer registry
File: `ternent-api/persisted/pixpax/issuers.json`

Fields:
- `issuerKeyId`
- `name`
- `publicKeyJwk` (or PEM)
- `status`: active | revoked
- optional: `createdAt`, `notes`

Endpoints:
- `GET /v1/pixpax/issuers` (list active)
- `GET /v1/pixpax/issuers/:issuerKeyId` (get one)

Client caches keys; platform key pinned.

## 4. Redemption endpoint
`POST /v1/pixpax/redeem` (or colocate under collections route)

Request:
- `token`
- `collectorPubKey`
- optional `collectorSig` over token hash (proof-of-possession)

Server steps:
1) Verify token signature using issuer public key from registry
2) Validate payload fields (kind, exp, etc.)
3) Enforce single-use (idempotent write)
4) Mint:
   - fixed-card: mint exact `cardId` (no randomness)
   - pack: mint pack using existing logic
5) Persist ownership / domain events
6) Return mint result + receipt

## 5. Receipt format
Receipt payload:
- `v`: 1
- `codeHash`: sha256(payloadBytes)
- `issuerKeyId`
- `collectorPubKey`
- `mintRef`: packId / txId / cardInstanceId
- `serverTime`: epoch seconds

Receipt signature:
- server signing key (platform key or separate key)

Client stores receipt for proof.

## 6. UI rules
- Scan -> offline verify -> show preview -> redeem -> reveal
- Invalid signature => "Not official"
- Already claimed => "Already claimed" (friendly)
- No separate “fun vs collection” tabs.
- Scarcity/series are subtle metadata overlays later.

## 7. Dragon Code Book
- One `cardId` per dragon
- Generate N codes per dragon (supply by printing)
- If upset: generate new wave (new batch), same `cardId`, `wave += 1`
- No art differences, no rarity tables
