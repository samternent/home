# CLAUDE.md

`@ternent/ledger` (this directory) is append-only truth + verification.

- Preserve staged vs committed separation.
- Keep commit signing/chain verification rules aligned with `SPEC.md`.
- Encrypted payloads should use ledger protection (`protection: recipients`) instead of custom app crypto fields.
- Replay decryption is identity/decryptor dependent; lack of decrypt key yields `payload.type = encrypted`.
- Avoid introducing domain semantics into ledger primitives.
