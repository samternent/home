# SPEC 02 — Semantic Model: Identity Registry v0.2

File: specs/02-identity-registry.md  
Status: Normative  
Version: 0.2

## Purpose

Define a deterministic “Identity Registry” semantic layer that materializes a principal registry from ledger entries.

This layer supports the “users table” concept: principals are registered and updated over time; their age recipient public keys are available for encryption tooling.

This layer does not require signature verification to function, but may be used by verification tooling later.

## Principal

A principal is identified by principalId (string). Common forms include did:key identifiers, but the registry treats it as opaque.

Materialized principal state contains:

- principalId
- displayName (optional)
- ageRecipients: list of strings (age recipient public keys)
- metadata: optional object
- updatedAt: entry timestamp of latest update
- updatedBy: entry author of latest update

## Entry Kind: identity.upsert

Payload:

```
{
"principalId": "did:key:...",
"displayName": "Sam",
"ageRecipients": ["age1..."],
"metadata": { "any": "json" }
}
```

Rules:

- payload.principalId is required
- payload.ageRecipients is optional but recommended
- author MUST equal payload.principalId (self-assertion rule for v0.2)
- Latest identity.upsert wins (by replay order)
- Historical identity.upsert entries constitute the rotation history

Validation:

- ageRecipients entries must be non-empty strings
- identity.upsert must be deterministic to apply; no external checks

## Resolution API (Normative)

Identity tooling MUST provide:

- getPrincipal(state, principalId) → Principal | null
- resolveAgeRecipients(state, principalId) → string[] (empty if unknown)
- resolveCurrentAgeRecipient(state, principalId) → string | null (first element if present)

## Determinism

Identity state is derived solely from replaying entries in deterministic order.
No network lookups.
No time-of-day logic beyond comparing ISO timestamps present in entries when needed.

## Optional Future Extensions (Non-Normative)

- identity.key.rotate entry kind
- verification layer mapping author signatures to these keys
- allowing admin-managed identities (directory scope)
