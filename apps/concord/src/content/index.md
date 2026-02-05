---
title: Concord Whitepaper
author: Sam Ternent
version: 0.1
date: 2026-01-06
---

# A local‑first, verifiable ledger for application data

---

## Abstract

Concord is a browser‑native, local‑first ledger format designed to make application data **verifiable, portable, and inspectable** without relying on trusted infrastructure.

Rather than treating data as something managed by servers, Concord treats data as a **file with history**: an append‑only sequence of signed changes that can be replayed deterministically to reconstruct state.

Concord is not a product, a network, or a platform. It is a minimal foundation intended to be composed, extended, and interpreted by applications.

---

## Motivation

Modern software overwhelmingly assumes that:

- data lives in databases,
- integrity is enforced by servers,
- trust is implicit in infrastructure,
- users interact through accounts.

This model works well for centralized systems, but it breaks down when:

- users want to own their data,
- applications must work offline,
- storage cannot be trusted,
- auditability matters,
- systems must survive migration or abandonment.

Concord exists to answer a simple but fundamental question:

> **Has this data changed since it was written?**

Concord answers this question cryptographically, using only the data itself.

---

## Core Idea

At its heart, Concord models application data as:

- **Entries**: individual, immutable changes
- **Commits**: grouped sets of entries forming history
- **Replay**: deterministic reconstruction of state

This is conceptually similar to Git, but applied to **application state**, running entirely in the browser.

The ledger _is_ the source of truth.  
State is always derived, never stored.

---

## Design Goals

Concord is guided by a small number of strict principles:

### Minimal Core

Only primitives that are:

- essential,
- durable,
- verifiable,

belong in the core.

Everything else lives above it.

### Determinism

Given the same ledger, every correct implementation must derive the same state.

### Local‑First

Concord works without:

- servers,
- accounts,
- network access.

### Storage Agnosticism

The ledger assumes storage is untrusted.  
Integrity is self‑contained.

### Explicit Trade‑offs

Concord avoids “magic.”  
If something is not solved, it is stated plainly.

---

## Non‑Goals

Concord explicitly does **not** attempt to solve:

- networking or peer discovery,
- synchronization,
- multi‑writer consensus,
- conflict resolution,
- access policy enforcement,
- indexing or querying.

These problems are real — but they do not belong in the ledger core.

---

## Mental Model

Concord is best understood as:

> **Git‑like commits for application data**

- Entries are like file diffs,
- Commits group changes,
- Replay is checkout,
- History is immutable,
- State is derived.

Unlike Git:

- there is no branching model,
- there is no merge strategy,
- there is no remote.

Those concerns are application‑specific.

---

## Data Model Overview

### Ledger

A ledger is a portable file‑like object containing:

- format metadata,
- version,
- ordered commits,
- a head pointer.

### Commit

A commit:

- groups entries,
- references a parent commit,
- may include metadata (author, message, time),
- is immutable once created.

Commit identity is derived from its content.

### Entry

An entry:

- represents a single change,
- has a stable identifier,
- may include a payload,
- may be signed.

Entries are the smallest unit of meaning.

---

## Canonical Identity & Hashing

Identifiers are derived from **canonical hashes**.

### Entry ID

Computed from a canonical representation of:

- kind,
- timestamp,
- author,
- payload (or encrypted payload wrapper).

Signatures are applied **after** the ID is computed.

### Commit ID

Computed from:

- parent commit ID,
- timestamp,
- optional metadata,
- list of entry IDs.

Commit IDs never include:

- entry bodies,
- signatures,
- themselves.

This avoids circular dependency.

---

## Signatures & Authorship

Entries may be signed to prove authorship.

A signature proves:

- the entry content existed at signing time,
- the signer held the private key.

A signature does **not** prove:

- trustworthiness,
- correctness,
- acceptance by others.

Trust remains contextual and social.

---

## Replay & State Derivation

Concord never stores state.

Instead:

1. entries are ordered deterministically,
2. each entry is applied in sequence,
3. state emerges from replay.

This has important consequences:

- no hidden mutations,
- full auditability,
- easier debugging,
- predictable import/export.

Replay order is application‑defined but must be deterministic.

---

## Runtime Model

Most applications interact with Concord through a runtime abstraction.

Typical lifecycle:

1. authenticate identity,
2. load or create a ledger,
3. stage entries,
4. commit history,
5. replay to derive state.

Pending entries exist only in memory.  
Only committed history is durable.

---

## Plugin System

Concord encourages extension through **plugins and hooks,** not core features.

Plugins may:

- encrypt payloads,
- manage permissions,
- sync ledgers,
- bind UI components,
- persist data.

The ledger core remains unchanged.

This keeps the system adaptable without fragmentation.

---

## Encryption Philosophy

Concord separates **integrity** from **confidentiality.**

The ledger guarantees integrity.  
Encryption is applied at the payload level.

Encrypted payloads are opaque blobs:

```json
{
  "payload": {
    "enc": "age",
    "ct": "-----BEGIN AGE ENCRYPTED FILE-----..."
  }
}
```

The ledger does not:

- track recipients,
- manage keys,
- enforce policy.

Applications attempt decryption using available keys.

---

## Permissions as Data

Permissions can be modeled as entries.

A common pattern:

- encryption keys are stored as encrypted payloads,
- keys are shared by encrypting them for recipients,
- access emerges through key possession.

This allows:

- group access,
- delegation,
- revocation (by rotation),

without modifying the core ledger.

---

## Threat Model

Concord protects against:

- silent mutation,
- tampering,
- unauthorized history rewriting,
- storage corruption.

Concord does **not** protect against:

- compromised clients,
- leaked private keys,
- malicious applications,
- user error.

These limits are intentional and explicit.

---

## Why This Matters

Concord enables a different way of building software:

- data that survives products,
- applications that degrade gracefully,
- systems that can be audited years later,
- files that explain themselves.

It is not a replacement for databases or servers.  
It is a **different foundation.**

---

## Status & Future Work

Concord is experimental.

Active areas of exploration include:

- richer plugin ecosystems,
- optional sync transports,
- schema tooling,
- visualization and inspection tools.

The core contract is intentionally slow to change.

---

## Conclusion

Concord is an attempt to bring honesty back to application data.

By treating data as a file with history — rather than a mutable row in a database — Concord enables systems that are:

- verifiable,
- portable,
- inspectable,
- resilient.

It is small by design.  
It is incomplete by choice.

That is its strength.
