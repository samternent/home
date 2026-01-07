# Concord Protocol Specification

**Version 1.0 — Draft**  
**Authors:** Sam Ternent and Concord Community  
**Date:** 2026‑01‑07

---

## 1 Introduction

### 1.1 Purpose

The Concord Protocol defines a **verifiable, deterministic, local‑first ledger format** for application data. It specifies canonical data structures, hashing rules, identity and signature models, replay semantics, and invariants required for any conformant implementation. Concord is not a network protocol, consensus system, or synchronization model. It is a **data format and interpretation contract**.

### 1.2 Goals

The Concord Protocol aims to:

- Provide a deterministic, verifiable ledger format
- Guarantee integrity without trusted servers
- Enable portable application state
- Allow multiple implementations across languages, environments, and storage backends

### 1.3 Non‑Goals

Concord does not specify:

- Peer‑to‑peer networking
- Synchronization protocols
- Multi‑writer consensus
- Conflict resolution strategies
- Querying or indexing mechanisms
- Access policies or enforcement layers

---

## 2 Terminology

Unless otherwise defined, terms in this document use their ordinary meanings. The following definitions are normative:

- Ledger – A sequence of ordered commits forming an immutable history
- Commit – A container of ordered entries referencing a parent commit
- Entry – A single, immutable data record representing a change
- Canonical Representation – A deterministic serialization defined by this spec
- Identifier – A hash computed from a canonical representation
- Signature – Cryptographic proof binding an identity to content

---

## 3 Data Structures

### 3.1 Overview

Concord defines three primary structures:

1. Entry
2. Commit
3. Ledger Container

These structures are defined in canonical JSON and hashed according to Section 8.

---

## 4 Entry

### 4.1 Definition

An Entry is the smallest protocol unit representing an atomic change. It contains metadata and an optional payload.

Example structure:

```
{
"kind": "<string>",
"timestamp": "<ISO8601 UTC>",
"author": "<string>",
"payload": { ... } | null,
"signature": "<base64>" | null
}
```

- kind: A string denoting entry type (application defined)
- timestamp: UTC ISO8601 timestamp of entry creation
- author: A unique identifier for the author entity
- payload: Application data or encrypted blob
- signature: An optional signature over the canonical entry content without the signature field

### 4.2 Entry Invariants

- Must include kind, timestamp, and author
- Payloads can be plaintext or opaque encrypted artifacts
- Signatures (if present) must conform to Section 9

---

## 5 Commit

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

- parent: The previous commit’s ID; null if root
- metadata: Optional key/value pairs (message, author, etc.)
- entries: Ordered list of EntryIDs included in this commit

### 5.2 Commit Invariants

- A commit must reference an existing parent or be the root
- EntryIDs must correspond to entries stored externally or within the ledger container
- Metadata is opaque; interpretation is outside this spec

---

## 6 Ledger Container

The Ledger Container holds all commits, entries, and a head pointer.

### 6.1 Definition

```
{
"format": "concord‑ledger",
"version": "1.0",
"commits": { "<CommitID>": { ... } },
"entries": { "<EntryID>": { ... } },
"head": "<CommitID>"
}
```

- format: Literal "concord‑ledger"
- version: Protocol version
- commits: Map of commit IDs to commit structures
- entries: Map of entry IDs to entry structures
- head: CommitID of the latest commit

---

## 7 Canonical Serialization

### 7.1 JSON Canonical Form (JCF)

All protocol identifiers are computed over a canonical serialization that follows these rules:

- Keys sorted lexicographically
- Strings encoded in UTF‑8
- No whitespace outside of structural separators
- Deterministic JSON output is required for hashing

Implementations MUST canonicalize JSON objects before hashing.

---

## 8 Identifier Computation

### 8.1 EntryID

EntryID is the hex‑encoded SHA‑256 of the canonical entry representation excluding the signature field.

EntryID = SHA256( canonical JSON of entry without signature )

### 8.2 CommitID

CommitID is the hex‑encoded SHA‑256 of the canonical commit representation.

CommitID = SHA256( canonical JSON of commit )

---

## 9 Signatures

### 9.1 Purpose

Signatures bind an identity to entry content to attest authorship.

### 9.2 Signature Input

Signatures MUST be computed over the canonical JSON of the entry without the signature field.

### 9.3 Signature Format

- Base64 encoded
- Associated with cryptographic keys external to this spec
- Interpretation of specific key formats is out of scope

---

## 10 Replay Semantics

### 10.1 Definition

Replay is the deterministic application of commits in sequence to reconstruct state.

### 10.2 Procedure

1. Start at the root commit
2. For each commit in canonical order:  
   a. Retrieve entries by EntryID  
   b. Apply entries in listed order
3. Derive application state via an application‑specific handler

Protocol guarantees deterministic ordering based on commit graph.

---

## 11 Extensions

Concord is extensible via:

- Custom entry kinds
- Metadata fields
- Plugin interpreters

Extensions must not violate canonical rules.

---

## 12 Conformance

To be Concord conformance:

1. All identifiers must be computed as specified
2. Serialization must adhere to canonical rules
3. Replay must be deterministic
4. Signature processing must follow Section 9

No prohibited behaviors are implied.

---

## 13 Security Considerations

### 13.1 Integrity

Protocol defends against tampering via hashes and signatures.

### 13.2 Confidentiality

Confidentiality is out of scope; encryption is at payload level.

### 13.3 Trust

Trust models are application defined.

---

## 14 Example

Root Entry:

```
{
"author": "did:example:alice",
"kind": "init",
"payload": { "message": "root" },
"timestamp": "2026‑01‑01T00:00:00Z"
}
```

Commit:

```
{
"parent": null,
"timestamp": "2026‑01‑01T00:01:00Z",
"metadata": { "msg": "init" },
"entries": ["<EntryID>"]
}
```

---

## 15 IANA Considerations

None.

---

## 16 Acknowledgements

Thanks to early contributors in the Concord ecosystem.

---

## 17 Document History

Version | Date | Changes
1.0 | 2026‑01‑xx | Initial draft
