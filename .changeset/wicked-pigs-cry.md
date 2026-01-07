---
"@ternent/concord-protocol-wasm": patch
"@ternent/concord-test-vectors": patch
"@ternent/concord-protocol": patch
---

- Harden canonical hashing/signing inputs and add validation/replay helpers.- Add commit/entry append helpers, strict commit appends, and protocol test vectors.- Inline canonical/crypto helpers to keep protocol-critical behavior local.- Lock shared test vectors and reject non-finite numbers and toJSON inputs.- `getCommitChain` now throws on invalid ledgers instead of returning partial chains.- `EncryptedPayload` is no longer exported from this package.- Canonicalization now rejects non-finite numbers and objects with `toJSON`.
