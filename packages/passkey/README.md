# `@ternent/passkey`

Origin-bound passkey helpers for local unlock and approval flows in Concord apps.

## Notes

- `validateApprovalContext()` validates challenge/origin/rpId/flags and can optionally verify assertion signatures when `credentialPublicKey` is provided.
- `verifyApproval()` is an alias of `validateApprovalContext()`.
- `deriveEphemeralApprovalKey()` / `deriveUnlockKey()` derives per-approval key material from assertion bytes and is intended for ephemeral action/session use.
- `approve()` supports optional PRF extension input via `prf.salt`, exposing `approval.secrets.prfOutput` when available.
- `register()` captures the credential public key (`SPKI` + `JWK`) so unlock/approval verification can be cryptographically enforced.
