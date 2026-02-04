# Concord Stickerbook Demo

Stickerbook is a playful Concord demo where each profile opens one deterministic
pack per period and collects a series of creatures in a nostalgic 90s layout.
Your book is built from ledger assertions, not server state.

## How determinism works

- The catalogue is generated from seeded candidates and stored as an immutable
  series file.
- Pack minting uses a HMAC-based PRNG seeded by
  `(seriesId, catalogueVersion, periodId, profile)`.
- The client verifies the pack signature before committing ledger assertions.

## Why Concord fits

Concord is append-only, identity-driven, and auditable. That means:

- Every sticker you collect is an assertion you can verify later.
- There is no central authority deciding what you own; the ledger is the source
  of truth.
- You can rebuild your collection from deterministic inputs at any time.

## How this differs from NFTs or loot boxes

- No speculative scarcity: stickers are deterministic, not market-traded assets.
- Transparent odds: pack contents are derived, not hidden or random.
- No gambling loop: you open one pack per period with predictable outcomes.
