---
title: Concord Protocol Specification
author: Sam Ternent
version: 0.1
date: 2026-01-06
---

# Concord Protocol Specification

## Table of Contents

1. Introduction
2. Terminology
3. Data Structures
4. Entry
5. Commit
6. Ledger Container
7. Canonical Serialization
8. Identifier Computation
9. Signatures
10. Replay Semantics
11. Extensions
12. Conformance
13. Security Considerations
14. Genesis Block Specification
15. Key Regeneration and Recovery
16. Example
17. IANA Considerations
18. Acknowledgements
19. Document History

## 1. Introduction

### 1.1 Purpose

The Concord Protocol defines a verifiable, deterministic, local-first ledger format for application data. It specifies canonical data structures, hashing rules, identity and signature models, replay semantics, and invariants required for conformant implementations. Concord is not a network protocol, consensus system, or synchronization model. It is a data format and interpretation contract.

### 1.2 Goals

- Provide a deterministic, verifiable ledger format
- Guarantee integrity without trusted servers
- Enable portable application state
- Allow multiple implementations across languages, environments, and storage backends

### 1.3 Non-goals

Concord does not specify:

- Peer-to-peer networking
- Synchronization protocols
- Multi-writer consensus
- Conflict resolution strategies
- Querying or indexing mechanisms
- Access policies or enforcement layers

## 2. Terminology

Unless otherwise defined, terms in this document use their ordinary meanings. The following definitions are normative:

- Ledger: A sequence of ordered commits forming an immutable history
- Commit: A container of ordered entries referencing a parent commit
- Entry: A single, immutable data record representing a change
- Canonical representation: A deterministic serialization defined by this spec
- Identifier: A hash computed from a canonical representation
- Signature: Cryptographic proof binding an identity to content

## 3. Data Structures

### 3.1 Overview

Concord defines three primary structures:

1. Entry
2. Commit
3. Ledger Container

These structures are defined in canonical JSON and hashed according to Section 8.

## 4. Entry

### 4.1 Definition

An Entry is the smallest protocol unit representing an atomic change. It contains metadata and an optional payload.

Example:

```
{
  "kind": "<string>",
  "timestamp": "<ISO8601 UTC>",
  "author": "<string>",
  "payload": { ... } | null,
  "signature": "<base64>" | null
}
```

Fields:

- kind: A string denoting entry type (application defined)
- timestamp: UTC ISO8601 timestamp of entry creation
- author: A unique identifier for the author entity
- payload: Application data or encrypted blob
- signature: Optional signature over the canonical entry content without the signature field

### 4.2 Entry Invariants

- Entries MUST include kind, timestamp, and author
- Payloads MAY be plaintext or encrypted artifacts
- Signatures (if present) MUST conform to Section 9

## 5. Commit

### 5.1 Definition

A Commit groups a sequence of entries and references a parent commit.

Example:

```
{
  "parent": "<CommitID>" | null,
  "timestamp": "<ISO8601 UTC>",
  "metadata": { "key": "value" } | null,
  "entries": ["<EntryID>", ...]
}
```

Fields:

- parent: The previous commit’s ID; null if root
- timestamp: UTC ISO8601 timestamp of commit creation
- metadata: Optional key/value pairs (message, author, etc.)
- entries: Ordered list of EntryIDs included in this commit

### 5.2 Commit Invariants

- A commit MUST reference an existing parent or be the root
- EntryIDs MUST correspond to entries stored externally or within the ledger container
- Metadata is opaque; interpretation is outside this spec

## 6. Ledger Container

The Ledger Container holds all commits, entries, and a head pointer.

### 6.1 Definition

```
{
  "format": "concord-ledger",
  "version": "1.0",
  "commits": { "<CommitID>": { ... } },
  "entries": { "<EntryID>": { ... } },
  "head": "<CommitID>"
}
```

Fields:

- format: Literal "concord-ledger"
- version: Protocol version
- commits: Map of commit IDs to commit structures
- entries: Map of entry IDs to entry structures
- head: CommitID of the latest commit

## 7. Canonical Serialization

### 7.1 JSON Canonical Form (JCF)

All protocol identifiers are computed over a canonical serialization that follows these rules:

- Keys sorted lexicographically
- Strings encoded in UTF-8
- No whitespace outside structural separators
- Deterministic JSON output is required for hashing

Implementations MUST canonicalize JSON objects before hashing.

## 8. Identifier Computation

### 8.1 EntryID

EntryID is the hex-encoded SHA-256 of the canonical entry representation excluding the signature field.

```
EntryID = SHA256( canonical JSON of entry without signature )
```

### 8.2 CommitID

CommitID is the hex-encoded SHA-256 of the canonical commit representation.

```
CommitID = SHA256( canonical JSON of commit )
```

## 9. Signatures

### 9.1 Purpose

Signatures bind an identity to entry content to attest authorship.

### 9.2 Signature Input

Signatures MUST be computed over the canonical JSON of the entry without the signature field.

### 9.3 Signature Format

- Base64 encoded
- Associated with cryptographic keys external to this spec
- Interpretation of specific key formats is out of scope

## 10. Replay Semantics

### 10.1 Definition

Replay is the deterministic application of commits in sequence to reconstruct state.

### 10.2 Procedure

1. Start at the root commit.
2. For each commit in canonical order:
   1. Retrieve entries by EntryID.
   2. Apply entries in listed order.
3. Derive application state via an application-specific handler.

Protocol guarantees deterministic ordering based on commit graph.

## 11. Extensions

Concord is extensible via:

- Custom entry kinds
- Metadata fields
- Plugin interpreters

Extensions must not violate canonical rules.

## 12. Conformance

To conform to the Concord Protocol:

1. All identifiers MUST be computed as specified.
2. Serialization MUST adhere to canonical rules.
3. Replay MUST be deterministic.
4. Signature processing MUST follow Section 9.

No prohibited behaviors are implied.

## 13. Security Considerations

### 13.1 Integrity

The protocol defends against tampering via hashes and signatures.

### 13.2 Confidentiality

Confidentiality is out of scope; encryption is at the payload level.

### 13.3 Trust

Trust models are application-defined.

## 14. Genesis Block Specification

### 14.1 Purpose

The Genesis Block (Block 0) establishes the immutable root of a Concord ledger. It defines protocol-level metadata and anchors all subsequent history.

It is not an application commit and MUST NOT include entries or data intended for replay.

### 14.2 Structure

Genesis is a valid commit with the following properties:

- parent: always null
- entries: always an empty array
- metadata.genesis: MUST be true
- metadata.spec: MUST identify the Concord protocol version
- timestamp: required for audit and ordering

Genesis MAY include optional metadata such as:

- created_at: explicit creation timestamp
- implementation: informational, non-binding identifier

### 14.3 Genesis Commit Schema

Example:

```
{
  "parent": null,
  "timestamp": "2026-01-01T00:00:00Z",
  "metadata": {
    "genesis": true,
    "spec": "concord-protocol@1.0",
    "created_at": "2026-01-01T00:00:00Z",
    "implementation": "concord-js@0.4.2"
  },
  "entries": []
}
```

### 14.4 Validation Rules

Implementations MUST enforce the following rules:

- Genesis MUST be the first commit
- parent MUST be null
- entries MUST be an empty array
- metadata.genesis MUST be true
- metadata.spec MUST match the supported protocol version
- Genesis MUST NOT be removed, rewritten, or squashed
- Genesis MUST NOT contain any entries

### 14.5 Behavior

Genesis is not replayed, interpreted, or inspected beyond validation. It exists to:

- Anchor the DAG
- Identify the ledger as Concord-compatible
- Declare protocol version

### 14.6 Rationale

Genesis is minimal by design. It separates:

- Protocol structure (Block 0)
- Application meaning (Block 1 and onward)

This enables deterministic and verifiable bootstrapping across implementations.

## 15. Key Regeneration and Recovery

### 15.1 Purpose

Concord identities may need to rotate or regenerate their key material to:

- Replace expired or compromised keys
- Migrate to stronger algorithms or formats
- Support recovery mechanisms

This section defines the canonical model for key rotation, continuity, and optional recovery delegation.

### 15.2 Identity Model

In Concord, identity is represented by a persistent identifier (e.g., did:key, did:web, or a stable public key fingerprint). This identity:

- Remains stable across key changes
- Signs new key material to authorize transitions
- MAY optionally delegate recovery capabilities to others

### 15.3 Key Rotation Entry

A key rotation is modeled as an explicit entry of kind key-rotation.

Example:

```
{
  "kind": "key-rotation",
  "timestamp": "2026-01-02T00:00:00Z",
  "author": "did:key:z6Mk...",
  "payload": {
    "old_key_fingerprint": "SHA256:abcd1234",
    "new_public_key": "-----BEGIN PUBLIC KEY-----...",
    "encryption_key": "age1q...",
    "rotation_reason": "voluntary"
  },
  "signature": "<base64>"
}
```

Required payload fields:

- old_key_fingerprint: SHA-256 or JWK thumbprint of the previous key
- new_public_key: PEM or JWK string (application-defined format)
- encryption_key: Public encryption key for sealed payloads
- rotation_reason: Optional string for audit/logging

### 15.4 Validation and Replay

- Only the author of the entry may sign a valid key-rotation.
- Clients MAY reject unsigned or externally signed rotations.
- Replay MUST apply the new key in sequence; prior entries remain signed by the old key.

Applications are responsible for:

- Updating key lookup caches
- Tracking current vs. historic keys
- Validating signatures against appropriate versions

### 15.5 Key History and Resolution

Ledger consumers SHOULD track:

- A historical map of valid keys per identity
- The canonical chain of rotations
- Entry signature validity using the correct historical key

This enables:

- Long-term audit trails
- Historical verification
- Deterministic resolution

### 15.6 Recovery and Delegation (Optional)

Applications MAY support recovery via one of the following:

#### a. Pre-authorized Recovery Key

Define a secondary key in advance that may publish a rotation:

```
{
  "kind": "key-delegation",
  "timestamp": "...",
  "author": "did:key:alice",
  "payload": {
    "delegate": "did:key:bob",
    "capability": "key-rotation",
    "expires": "2027-01-01T00:00:00Z"
  },
  "signature": "..."
}
```

This delegate may later publish a key-rotation on behalf of the author.

#### b. Social Recovery

Model recovery as an N-of-M multisignature scheme. This is application-specific and not defined in the Concord core.

### 15.7 Mnemonic-Based Recovery (Optional)

This specification does not require a 12- or 24-word seed phrase (e.g., BIP39). Implementations MAY offer:

- Mnemonic-derived key pairs
- Passphrase-based KDFs
- Wallet compatibility

Such schemes MUST remain external to the Concord ledger and are not required for protocol conformance.

### 15.8 Security Considerations

- Key rotation does not remove or invalidate past signatures.
- Lost keys render past entries unverifiable unless cached.
- Delegated recovery MUST be carefully validated to prevent misuse.

### 15.9 Key Resolution Semantics

#### Purpose

To resolve the current valid signing key for a given identity across a ledger's history.

#### Rules

1. Initialization: Each identity begins with an initial key, the one used in the earliest valid entry authored by that identity.
2. Rotation chain: A chain of key-rotation entries, each signed by the previous key, forms the continuity path.
3. Validation:
   - Each key-rotation entry MUST reference a valid prior key by fingerprint.
   - The new key becomes valid only after successful verification of the signature by the old key.
4. Ambiguity resolution:
   - If multiple valid rotation chains exist for the same identity, the one with:
     1. The longest valid chain, then
     2. The earliest final rotation timestamp,
        is considered canonical.
   - Clients MAY warn on forks, but MUST select deterministically.
5. Current key resolution: The current signing key is the most recent valid key in the canonical rotation chain.
6. Legacy signature validation: When validating historical entries, clients MUST use the key that was active at the time the entry was signed, based on replay order.

### 15.10 Key Revocation Entry

#### Purpose

To explicitly revoke a prior signing key and prevent its future use even if not superseded by rotation.

This allows:

- Disabling compromised or untrusted keys
- Limiting a key’s validity range
- Improving trust signaling across systems

#### Entry Format

```
{
  "kind": "key-revocation",
  "timestamp": "2026-02-01T00:00:00Z",
  "author": "did:key:abc...",
  "payload": {
    "revoked_key_fingerprint": "SHA256:abcd1234",
    "reason": "compromised",
    "effective_from": "2026-01-31T00:00:00Z"
  },
  "signature": "<base64>"
}
```

#### Rules

- revoked_key_fingerprint MUST match a previously valid key for the author
- effective_from is optional; if absent, revocation is immediate
- reason is optional; for audit only

#### Behavior

- After effective_from, the revoked key MUST NOT be used to validate new entries
- Past entries signed before effective_from remain valid
- Rotation to a revoked key is invalid

#### Security Note

Revocation cannot retroactively invalidate valid historical signatures.

## 16. Example

Root Entry:

```
{
  "author": "did:example:alice",
  "kind": "init",
  "payload": { "message": "root" },
  "timestamp": "2026-01-01T00:00:00Z"
}
```

Commit:

```
{
  "parent": null,
  "timestamp": "2026-01-01T00:01:00Z",
  "metadata": { "msg": "init" },
  "entries": ["<EntryID>"]
}
```

## 17. IANA Considerations

None.

## 18. Acknowledgements

Thanks to early contributors in the Concord ecosystem.

## 19. Document History

| Version | Date       | Changes                           |
| ------- | ---------- | --------------------------------- |
| 1.0     | 2026-01-xx | Initial draft                     |
| 1.0-r1  | 2026-01-xx | Added Genesis Block Specification |
