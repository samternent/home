# PixPax v2 Issuance And Proof Contract Spec

## Canonical proof model

PixPax v2 uses Seal-native Ed25519 proofs as the canonical issuer attestation format.

Each signed artifact contains:

- `payload`
- `proof`

The proof subject hash is the canonical hash of the payload bytes.

## Pack issuance payload

Core fields:

- `type = pixpax-pack-issuance`
- `issuanceKind = deterministic | designated`
- `derivationVersion = pixpax-pack/v2`
- `claimUniqueness`
- `claimant`
- `collectionId`
- `collectionVersion`
- `dropId`
- `packId`
- `issuedAt`
- `cards`
- `itemHashes`
- `packRoot`
- `contentsHash`

## Deterministic derivation invariants

- claimant input is the Pixbook identity public key
- input is canonicalized before hashing
- derivation is versioned
- drop changes produce different deterministic material
- collection version changes produce different deterministic material

## Designated issuance invariants

- designated issuance bypasses deterministic selection
- designated issuance keeps the same signed artifact contract shape
- designated issuance may reference a source code id
