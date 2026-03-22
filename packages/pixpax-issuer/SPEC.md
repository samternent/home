# `@ternent/pixpax-issuer` Specification

`@ternent/pixpax-issuer` owns issuer-side issuance contracts, proof creation and verification, designated-code issuance helpers, and proof bundle helpers.

Hard invariants:

- Seal-native Ed25519 proofs are the canonical issuer attestation format
- deterministic issuance inputs are canonicalized before card selection
- designated issuance bypasses deterministic selection entirely
- transfer proofs are parallel to pack issuance proofs where possible
