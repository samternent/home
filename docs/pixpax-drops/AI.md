# AI Development Rules — PixPax Drops (ECDSA-only)

This file is the hard guardrail for AI agents and Future Sam.

## Mission (order matters)
1) Replace code signing with **ECDSA-only v2 tokens** (no HMAC legacy).
2) Add issuer public key registry + endpoints so clients can verify codes offline.
3) Add server-signed **receipts** returned after redemption/mint.
4) Implement fixed-card drops (Dragon Code Book) by committing `cardId` in payload and bypassing randomness.
5) Prepare for multi-identity account vault (optional login for management; not required for redemption).

## Hard constraints (must not violate)
### No artificial rarity
- NO probability weighting tables.
- NO hidden odds.
- NO time-based “rare windows”.
- Scarcity comes only from **how many codes are issued/printed** (explicit supply).

### No dark patterns
- NO streak pressure, manipulative timers, or nagging.
- UX must be calm and honest.

### Kid safety & privacy
- Redemption must work **without login**.
- Do not collect PII (names/emails) for basic use.
- No public leaderboards for kids.
- No location tracking.

### Honest verification
- Offline verification = issuer signature validity only.
- “Unused / claimed” requires server check.
- Pending vs final must be explicit; do not present pending as finalized.

### Backwards compatibility
- We are NOT maintaining HMAC v1 tokens.
- We WILL avoid breaking existing pack issuance behaviours, unless this feature is entirely new and not used by users yet.

## Output requirements
- Small, composable modules
- Tests for signing + verification + redeem idempotency
- Docs updated (this pack + repo README pointers)
- Clear PR checklist included in description
