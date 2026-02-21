# PLAN — Execution Order (AI agent)

## Phase A — Signing + verification foundation (must do first)
1) Add issuer registry file:
   - `ternent-api/persisted/pixpax/issuers.json`
2) Implement `ternent-api/routes/pixpax/domain/code-signing.mjs`:
   - `signTokenV2(payload) => token`
   - `verifyTokenV2(token) => { payload, issuer }`
3) Add issuer endpoints:
   - `GET /v1/pixpax/issuers`
   - `GET /v1/pixpax/issuers/:issuerKeyId`
4) Refactor any existing override/gift code generation to use ECDSA v2 token only.
   - Remove HMAC secrets and helpers entirely.
5) Add receipt signing returned on successful redeem.

## Phase B — Redemption route + idempotency
6) Implement `POST /v1/pixpax/redeem` (or extend existing redeem path):
   - verify token
   - enforce single-use (idempotent record)
   - mint fixed-card or pack
7) Tests:
   - valid token verifies
   - invalid signature fails
   - redeem twice => already-claimed
   - fixed-card mints exact `cardId`

## Phase C — Fixed-card drops
8) Add token payload fields for fixed-card:
   - `kind=fixed-card`
   - `cardId`
   - `wave`
9) Ensure mint path bypasses randomness and mints only `cardId`
10) Add admin helper endpoint/tool:
   - generate N tokens for a given `cardId` and `wave`
   - return list for printing

## Phase D — Frontend scan + redeem UX
11) Add scan route/page:
   - parse token from URL
   - fetch/cached issuer keys
   - offline verify token signature
   - show preview + redeem action
12) On redeem, store receipt + minted assets in local store/ledger

## Phase E — Multi-identity account vault (optional, later)
13) Define vault model (server): account -> identities
14) UI: switch identities safely; persist before switch
15) Backup/export/import flows
