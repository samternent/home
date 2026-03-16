---
"@ternent/identity": minor
"@ternent/seal-cli": minor
"seal": patch
"ternent-identity": patch
---

Introduce the new `@ternent/identity` package with Ed25519 signing, X25519 bridge helpers, and versioned JSON identity exports. Migrate `@ternent/seal-cli` and the Seal web app to the new identity format, `SEAL_IDENTITY` configuration, and Ed25519 proof artifacts while keeping `ternent-identity` as the documented legacy package for existing Concord and PixPax consumers.
