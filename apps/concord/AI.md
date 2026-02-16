# PixPax V2 — AI Development Rules (Read Before Writing Code)

This repo builds PixPax (a human-scale digital pack opening experience) on top of Concord (append-only integrity ledger).
AI-generated code is welcome, but MUST NOT violate the invariants below.

## Product Principles

- PixPax is not a platform. Avoid moderation systems, marketplaces, or growth mechanics by default.
- No swapping/marketplace logic unless explicitly requested in a future design doc.
- Packs should feel like physical packs: sealed, finite per pack, and not manipulable at open-time.
- We do NOT use weighted rarity / odds tables. If "rarity" exists it is purely cosmetic metadata and MUST NOT affect distribution.

## Core Invariants (Non-Negotiable)

1. **Seal-at-issue**

   - A pack’s contents are decided at issue-time (or mint-time), never at open-time.
   - The pack must commit to its contents (item hashes + merkle root + canonical commitment hash) before it can be opened.

2. **Append-only truth**

   - Domain state is represented as an append-only event stream.
   - No endpoint/function may “update” or “delete” domain facts. New facts must be appended as events.
   - DB/S3 may be used as caches or content stores but are NOT the source of truth.

3. **Rebuildability**

   - It must be possible to reconstruct core state from events + content:
     - what collections/series exist
     - what packs were issued
     - what packs were opened
     - what each pack contained
   - If a cache is wiped, the system still converges back to correct state after replay.

4. **Series lifecycle**

   - Series may be retired (no new packs issued), but a retired series must never be reopened.
   - A series’s card set is frozen once published. Do not add/remove cards from an existing series.
   - New ideas = new series. Corrections = new collection (or new series with new ID; never mutate old).

5. **Verification**
   - There must be a single canonical verifier for pack integrity:
     - verifies commitment hashes and merkle roots
     - verifies signatures where applicable
   - UI must not trust cache data without verification when it matters.

## Terminology (Use This Only)

- Collection: a themed world (e.g. Pixel Animals)
- Series: a frozen set within a collection (e.g. Pixel Animals — Series 1)
- Pack: a sealed issuance from exactly one series

Avoid legacy terminology: "stickerbook" (deprecated).

## Architecture Rules

- Keep "chrome" (card frame/effects/labels) separate from "art renderers".
- Renderers must be pluggable (e.g. idx4 packed pixels vs kit/layers).
- Do not spread hashing/merkle logic across modules; keep it in one domain module.
- Avoid flag-based branching like override/dev-untracked inside core logic; use explicit event types and policy modules.

## Concord Protocol Alignment (Required)

PixPax is a Concord semantic application. Keep the Concord L1/L2 boundary intact:

- L1 (core protocol) handles only canonicalization, IDs, ordering, and replay mechanics.
- L2 (PixPax semantics) defines entry/event kinds and replay reducers for domain meaning.
- Never bake PixPax business semantics into protocol-core assumptions.

When implementing cryptographic or ledger logic, prefer `@ternent/concord-protocol` primitives:

- `canonicalStringify` for canonical JSON
- `deriveEntryId` / `deriveCommitId` for protocol IDs
- `getEntrySigningPayload` for signature bytes

Never use ad-hoc `JSON.stringify` hashing for protocol-addressed data.

Canonicalization guardrails (from Concord rules):

- No `undefined` values in canonicalized structures
- No `toJSON`-driven objects
- No `NaN` / `Infinity`
- Optional fields should be omitted, not set to `undefined`

Signature guardrails:

- Entry signatures sign entry-core only (signature field excluded)
- Assertion signatures sign assertion-core only (`id` and `signature` excluded)
- Key IDs and epoch IDs must be deterministic derivations, not random labels

Replay guardrails:

- State reducers MUST be deterministic under replay from genesis/head ordering
- Materialized tables/views are caches only; authoritative truth is append-only history
- Verification must fail closed on canonicalization/hash/signature mismatch

## Security / Abuse Guardrails

- Admin or privileged actions must be explicit and auditable (events).
- Do not introduce hidden "backdoors" (e.g. mutating pack status in DB).
- Do not store secrets in ledger payloads.

## Testing Tripwires (Must Keep Passing)

- Rebuild-from-events: wipe caches, replay events, state matches.
- Determinism/Integrity: a pack verifies to the same commitment every time.
- Tamper detection: editing cached DB/S3 state causes verification failure.

## Verifier Checklist (Acceptance Gate)

`verifyPack(packId | packEntry)` must fail closed and return a specific reason code.

1. Pack existence
   - Resolve canonical `pack.issued` event by `packId`.
   - Reject missing packs.
2. Series reference
   - Ensure pack references an existing collection/version and a valid series context.
   - Reject unknown or retired-with-reopen attempts.
3. Canonical card payload integrity
   - Recompute each card hash from canonical payload bytes.
   - Compare against stored `itemHashes` in order.
4. Merkle integrity
   - Recompute merkle root from canonical item hashes.
   - Match `packRoot` exactly.
5. Commitment integrity
   - Recompute `contentsCommitment` from `{ itemHashes, count, packRoot }`.
   - Match event payload commitment.
6. Signature integrity
   - Verify issuer signature against trusted issuer public key set.
   - Verify signed payload bytes are canonical and unchanged.
7. Receipt integrity (when receipt is present)
   - Verify segment linkage and segment hash chain.
   - Verify event inclusion proof resolves to segment hash.
8. Cache distrust
   - Never trust DB/S3 cached pack/card/index state unless it matches event commitments.

## Domain Event Contract

Every successful PixPax domain mutation emits a typed `PixPaxEvent`.
Current baseline event set:

- `collection.created`
- `series.added`
- `series.retired`
- `card.added`
- `pack.issued`
- `pack.claimed`
- `giftcode.created`
- `giftcode.redeemed`
- `pack.invalidated` (last resort)

Non-mutating reads MUST NOT emit events.

## Tripwire Acceptance Criteria

The following are release blockers for PixPax V2:

1. No mutation without event emission
   - Collection upload, index publish, card upload, gift-code creation/redeem, and pack issuance must emit `PixPaxEvent`.
2. Replay convergence
   - Rebuild core state from events + immutable content blobs after cache wipe.
3. Tamper failure
   - If card/index/claim cache data is edited, `verifyPack` fails loudly.
4. Deterministic verification
   - Repeated verification of same pack returns identical hash/root/signature verdicts.
5. Retired-series safety
   - Issuance API rejects new packs from retired series.
6. RNG boundary
   - Issuance randomness is reachable only through `RngSource`, never direct `Math.random`.

## When Uncertain

If an implementation choice could violate any invariant, STOP and propose alternatives in a comment/PR description rather than choosing the convenient path.
