---
title: Core primitives
description: The fundamental building blocks that make up the Concord system.
---

## Overview

Concord is composed of a small set of core primitives.

Each primitive has a clearly defined role, a narrow responsibility, and explicit guarantees.  
The system works by composing these primitives, rather than by relying on a monolithic design.

This page describes the primitives conceptually.  
Specific formats and rules are defined in the specification sections.

---

## Identity

An **identity** in Concord represents an entity capable of signing data.

Identities are used to:

- sign ledger entries
- verify authorship
- establish continuity over time

An identity consists of:

- a cryptographic key pair
- a stable identifier derived from the public key

Concord does not define:

- identity verification against real-world persons
- permissions or access control
- key recovery or escrow

If a signature verifies, the identity is valid.  
What that identity _means_ is left to the application layer.

---

## Ledger

The **ledger** is the central data structure in Concord.

It is:

- append-only
- ordered
- cryptographically chained

Each entry in the ledger:

- commits to the previous entry
- includes a payload (encrypted or plaintext)
- is signed by an identity

Because each entry commits to the full history:

- entries cannot be modified
- entries cannot be reordered
- entries cannot be removed

Any violation of these rules is detectable during verification.

---

## Payload

A **payload** is the application-defined data stored in a ledger entry.

Concord treats payloads as opaque data:

- it does not interpret their contents
- it does not enforce schemas
- it does not assume they are readable

Payloads may be:

- encrypted
- compressed
- structured
- arbitrary binary data

The only requirement is that payload bytes are included in the cryptographic commitment for the entry.

---

## Encryption

Encryption in Concord is optional but strongly encouraged.

When encryption is used:

- payloads are encrypted before being written to the ledger
- encryption happens entirely client-side
- storage providers never see plaintext

Concord defines:

- when encryption occurs
- how encrypted payloads are committed to the ledger

It does not mandate:

- a specific encryption algorithm
- key distribution strategies
- access sharing models

Encryption ensures confidentiality.  
Ledger verification ensures integrity.  
These concerns are deliberately separated.

---

## Hashing and commitment

Concord relies on cryptographic hashes to create **commitments** between entries.

Each entry includes:

- a hash of the previous entry (or previous state)
- a hash of its own contents

This creates a chain where:

- the current state depends on all prior states
- any change invalidates all subsequent entries

Commitment is purely mathematical and does not rely on:

- timestamps
- servers
- external witnesses

---

## Verification

Verification is the process of checking that a ledger is internally consistent.

A verification process typically:

1. walks the ledger from start to end
2. recomputes hashes
3. validates signatures
4. confirms structural rules

Verification answers a single question:

> _Is this ledger exactly what it claims to be?_

Verification does **not** answer:

- whether the data is true
- whether the author was authorised
- whether the data should exist

Those questions belong outside the system.

---

## Storage

Concord treats storage as **untrusted**.

Ledgers may be stored:

- locally
- in cloud object storage
- in personal data pods
- on removable media

Storage is responsible only for:

- persisting bytes
- returning bytes on request

If storage:

- drops data
- modifies data
- reorders data

…the ledger will fail verification.

---

## Composition

These primitives are intentionally simple.

Concord gains its power from their combination:

- identities sign entries
- entries commit to history
- payloads are encrypted
- verification proves integrity
- storage is reduced to a dumb container

No single primitive is sufficient on its own.  
Together, they form a system with strong guarantees and minimal assumptions.

---

## Reference implementation

Concord provides reference implementations of these primitives as libraries.

These implementations are:

- intended to match the specification
- designed to be inspectable and replaceable
- not the only possible implementations

Details of the reference packages are documented separately.

---

## Summary

Concord is built from a small number of carefully scoped primitives.

Each primitive:

- does one thing
- makes explicit guarantees
- avoids hidden assumptions

This simplicity is intentional and foundational to the system.
