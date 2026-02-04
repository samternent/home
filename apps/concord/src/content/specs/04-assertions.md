# SPEC 04 — Semantic Model: Assertions v0.1

File: specs/04-assertions.md  
Status: Optional  
Version: 0.1

## Purpose

Define a minimal, append-only assertion entry type for signed claims.

An assertion captures:

“Identity X claims Y about subject Z at time T.”

Concord records the claim and guarantees integrity, authorship, ordering, and verifiability.
Concord does not evaluate truth or enforce behavior.

## Entry Kind

Entry kind: assertions

Payload:

```
{
  "id": "assertion-1",
  "subject": {
    "kind": "decision",
    "id": "decision-123"
  },
  "claim": "signed",
  "payload": { "note": "optional context" },
  "assertedBy": "did:example:alice",
  "assertedAt": 1717352400000,
  "signature": "..."
}
```

Field notes:

- id: application-defined identifier (not part of the signature)
- subject.kind: application-defined category
- subject.id: application-defined identifier
- claim: machine-readable verb
- payload: optional JSON-serializable context
- assertedBy: public identity key (or stripped form)
- assertedAt: client timestamp (number)
- signature: signature of the canonicalized assertion (see below)

## Signing Rules (Normative)

The assertion signature MUST be created using the asserting identity’s private
signing key.

The signature MUST cover the canonicalized JSON of:

- subject.kind
- subject.id
- claim
- payload (if present)
- assertedBy
- assertedAt

Canonicalization uses Concord canonical JSON rules (lexicographic object keys,
no whitespace, no toJSON, no non-finite numbers).

If payload is absent, it MUST NOT be included in the signing payload.
If payload is present (including null), it MUST be included.

## Ledger Behavior

- Assertions are append-only.
- Assertions MUST NOT be edited or deleted.
- Assertions use existing Concord permissions for write and read access.
- Assertions MAY reference encrypted subjects the verifier cannot decrypt.

## Non-Goals

- No workflow engine
- No truth evaluation
- No enforcement
- No required claim vocabulary
- No cross-entry mutation
- No uniqueness guarantees
