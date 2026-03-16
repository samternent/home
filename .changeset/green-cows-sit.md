---
"@ternent/identity": minor
"@ternent/seal-cli": minor
"seal": patch
"ternent-identity": patch
---

Introduce the new `@ternent/identity` package with Ed25519 signing, BIP-39 mnemonic recovery, Noble-backed Curve25519 conversion helpers, and versioned JSON identity exports. Migrate `@ternent/seal-cli` and the Seal web app to the seed-material envelope format, `SEAL_IDENTITY` configuration, and Ed25519 proof artifacts while keeping `ternent-identity` as the documented legacy package for existing Concord and PixPax consumers.
