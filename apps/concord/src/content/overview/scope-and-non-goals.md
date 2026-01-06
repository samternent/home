---
title: Scope and non-goals
description: What Concord intentionally does and does not attempt to solve.
---

## Purpose of this document

This document exists to make Concord’s scope explicit.

Concord is deliberately small and focused.  
Many features that _could_ be added are intentionally excluded.

This is not a statement of what Concord will **never** do — it is a statement of what Concord does **not do now**, and what it does **not require** in order to be correct or useful.

---

## In scope (v0)

Concord v0 is concerned with **data integrity**, not coordination.

Specifically, Concord provides:

- an append-only ledger model
- cryptographic commitment between entries
- deterministic verification of integrity
- client-side signing and optional encryption
- storage-agnostic persistence
- import/export of complete ledger state
- offline verification

A Concord ledger can answer the question:

> “Has this data been altered since it was written?”

Nothing more is required for Concord to be useful.

---

## Explicit non-goals (v0)

The following concerns are **explicitly out of scope** for Concord v0.

They may be explored later, but they are not required for correctness and are not part of the core system.

---

### Networking and replication

Concord does **not** define:

- a networking protocol
- peer discovery
- replication strategies
- transport mechanisms
- synchronization guarantees

Ledgers may be copied or transferred by any means (files, APIs, removable media).

How and when that happens is outside the system.

---

### Merge strategies and conflict resolution

Concord does **not** define:

- how divergent ledgers are reconciled
- how conflicts are resolved
- what constitutes “the same record”
- how concurrent writes should be handled

Merge semantics are:

- domain-specific
- application-specific
- inherently opinionated

Concord intentionally avoids encoding these opinions.

---

### Multi-writer consensus

Concord does **not** attempt to:

- coordinate multiple writers
- establish global ordering
- prevent forks
- resolve equivocation
- provide eventual consistency guarantees

Concord is not a consensus system.

A ledger may be written by one or many identities, but Concord does not attempt to arbitrate between them.

---

### Real-time collaboration

Concord does **not** provide:

- shared editing
- live updates
- collaborative cursors
- presence indicators

Any real-time behaviour must be built on top of Concord by applications.

---

### Authorization and permissions

Concord does **not** define:

- access control rules
- role systems
- permissions
- revocation semantics

Signatures establish authorship and continuity, not permission.

Authorization is an application concern.

---

### Business logic or schemas

Concord does **not**:

- enforce data schemas
- interpret payload contents
- validate domain-specific rules
- apply business logic

Payloads are opaque to the core system.

---

## Why these are non-goals

Each excluded feature shares at least one of the following traits:

- it is domain-specific
- it requires subjective decisions
- it introduces coordination complexity
- it couples Concord to a runtime environment
- it weakens the integrity-first guarantee

Including these concerns in the core system would:

- increase complexity
- reduce clarity
- blur responsibility boundaries
- make correctness harder to reason about

Concord remains small by design.

---

## Future compatibility (without commitment)

Although Concord v0 does not include merge or networking, it is designed to avoid unnecessary dead ends.

The system allows for:

- stable entry identifiers
- explicit parent references
- identity attribution
- signed metadata
- first-class “meta” entries

These make future layers _possible_ without making them _mandatory_.

---

## Layered model

Concord is intended to sit at the bottom of a stack:

```
Application layer
├─ domain semantics
├─ merge strategies
├─ collaboration UX
└─ permissions & policy

Optional sync / tooling layer
├─ replication helpers
├─ divergence detection
└─ merge candidates

Concord core
├─ ledger
├─ hashing & commitment
├─ signatures
├─ encryption
└─ verification
```

Only the bottom layer is defined here.

---

## Design principle

When evaluating whether a feature belongs in Concord, ask:

> “Is this required to prove integrity, or is it required to make an application convenient?”

If the answer is “convenient”, it belongs above Concord.

---

## Summary

Concord is intentionally incomplete.

Its value comes from:

- clarity of responsibility
- strength of guarantees
- resistance to scope creep

By clearly stating what Concord does **not** do, we protect what it does well.
