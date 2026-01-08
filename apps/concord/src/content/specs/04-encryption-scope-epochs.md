# SPEC 04 — Semantic Model: Encryption, Scope Keys, and Epochs v0.2

File: specs/04-encryption-scope-epochs.md  
Status: Normative  
Version: 0.2

## Purpose

Define how payload confidentiality is implemented using:

- scope-bound epoch keys
- age-wrapped distribution
- deterministic discovery of wraps

This layer depends on:

- Identity Registry for age recipient keys
- Permissions Registry for eligibility (who should receive wraps)

## Encrypted Payload Wrapper

When an entry payload is confidential, it MUST be stored as an encryption wrapper object:

```
{
"enc": "age",
"scope": "projects:alpha",
"epoch": 3,
"ct": "-----BEGIN AGE ENCRYPTED FILE-----\n...\n-----END AGE ENCRYPTED FILE-----"
}
```

Rules:

- enc MUST equal "age" in v0.2
- scope MUST be present
- epoch MUST be present and integer >= 1
- ct is an age ciphertext string

The plaintext inside ct is application-defined JSON.

## Scope Epoch State

Each scope has:

- currentEpoch (integer, default 1)
- wrapsByPrincipal: map principalId → wrap record for one or more epochs

## Entry Kind: enc.epoch.rotate

Payload:

```
{
"scope": "projects:alpha",
"newEpoch": 4,
"wraps": [
{
"principalId": "did:key:alice...",
"epoch": 4,
"wrap": {
"to": ["age1alice..."],
"ct": "-----BEGIN AGE ENCRYPTED FILE-----\n...\n-----END AGE ENCRYPTED FILE-----"
}
}
],
"note": "optional"
}
```

Rules:

- author must have admin for scope
- newEpoch MUST equal currentEpoch + 1
- each wraps[i].epoch MUST equal newEpoch
- wraps may be partial, but tooling SHOULD include all eligible principals

What is wrapped:

- The plaintext encrypted inside wrap.ct MUST be the epoch key material for (scope, newEpoch).
- Format of epoch key material is v0.2-defined as:
  ```
  { "kty": "oct", "scope": "projects:alpha", "epoch": 4, "key": "<base64>" }
  ```
  (Exact encoding can be refined; requirement is stable JSON inside the age ciphertext.)

## Entry Kind: enc.wrap.publish (Optional but Recommended)

If you want to decouple rotation from distribution, you may publish wraps independently.

Payload:

```
{
"scope": "projects:alpha",
"epoch": 4,
"principalId": "did:key:bob...",
"wrap": { "to": ["age1bob..."], "ct": "..." }
}
```

Rules:

- author must have grant or admin for scope
- used for invitations or incremental distribution without a full rotate event

If you use enc.wrap.publish, tooling must consider wraps from both enc.epoch.rotate and enc.wrap.publish.

## Eligibility Rules (Normative)

A principal is eligible to receive epoch wraps for a scope if:

- They have effective read (or higher) in that scope at the time of distribution.
- They have an age recipient key registered via identity.upsert.

Tooling SHOULD warn (not fail) when eligibility exists but recipient keys are missing.

## Decryption Resolution (Normative)

To decrypt an encrypted payload wrapper {scope, epoch, ct} for principal P:

1. Resolve P’s private age key from the local environment (out of scope for ledger).
2. Find a matching wrap record for (scope, epoch, principalId=P).
3. Decrypt wrap.ct to obtain epoch key material.
4. Use epoch key material to decrypt payload ct.

Step 4 is implementation-specific. If you are using age directly for payload encryption, the epoch key material may itself be used as a symmetric key (via age plugins or envelope encryption). The essential invariant is: wraps enable payload decryption.

## Revocation Model (Normative)

Revocation is handled operationally by:

- rotating scope epoch keys (enc.epoch.rotate)
- omitting revoked principals from wraps for the new epoch

Important:

- Old epochs remain readable to any party who previously obtained those keys.
- Concord does not claim perfect revocation.

## Determinism

Discovery of which wraps apply is deterministic from the ledger.
Actual decryption depends on possession of private keys (external).
