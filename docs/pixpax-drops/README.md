# PixPax Drops — AI Execution Pack (ECDSA-only)  
Date: 2026-02-21

Drop this folder into the repo (recommended path: `docs/pixpax-drops/`) and point your AI agent at:
- `AI.md`
- `PLAN.md`
- `SPEC.md`
- `CHECKLIST.md`

This pack is **strict** about constraints: no HMAC legacy, no artificial rarity weighting, kid-safe defaults, honest verification.

---

## What we are building

### V2 Signed Codes (ECDSA-only)
We will implement a single, modern code format:

- **Code token**: `base64url(payloadBytes) + "." + base64url(signatureBytes)`
- Signature: **ECDSA P-256** over `SHA-256(payloadBytes)`
- Payload: compact JSON (CBOR optional later)

Client can verify **offline authenticity** by fetching issuer public keys once and caching.

### Fixed-card drops (Dragon Code Book)
A code can commit to a **specific card template** (`cardId`) and will mint exactly that card.
- 1 code = 1 issuance
- Wave is metadata only (no visual hierarchy by default)

### Multi-identity accounts (parent manages kids)
Redemption must work without login.
Account features are for:
- backup/restore
- switching identities
- managing multiple identities

---

## Repo touchpoints (expected)
Backend:
- `ternent-api/routes/pixpax/collections/index.mjs` (pack issuance + override code endpoints)
- `ternent-api/routes/pixpax/domain/issuance-policy.mjs` (policy selection)
- `ternent-api/routes/pixpax/collections/content-store.mjs` (persistence: override codes + uses + claims)
- Add new:
  - `ternent-api/routes/pixpax/domain/code-signing.mjs`
  - `ternent-api/routes/pixpax/issuers/index.mjs` (issuer public key endpoints)
  - `ternent-api/persisted/pixpax/issuers.json` (issuer registry)

Frontend:
- `concord/src/module/pixpax/` (scan/redeem UI + identity)
- Add scan route/page if not already present.

---

## Non‑negotiables (lines)
See `AI.md`.
