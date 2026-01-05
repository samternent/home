---
title: What is Concord
description: A client-side, append-only, cryptographically verifiable ledger system.
---

## One sentence

Concord is a client-side, append-only, cryptographically verifiable ledger system designed to prove the integrity of data without trusting the storage layer.

---

## The problem it addresses

Many systems need to answer a deceptively simple question:

> _Has this data been changed since it was written?_

In most applications, the answer depends on trust:

- trust in a database
- trust in a server
- trust in an operator
- trust that backups and migrations were done correctly

Concord removes that trust requirement.

It allows data to be:

- created locally
- encrypted locally
- signed locally
- stored anywhere
- verified independently at any time

If the data verifies, it is valid.  
If it does not, the tampering is detectable.

---

## What Concord is

Concord is a **ledger system**, but not a blockchain.

It is:

- **append-only** – entries are never modified or deleted
- **cryptographically chained** – each entry commits to the previous state
- **verifiable** – integrity can be checked without external context
- **client-side** – all cryptography happens in the client
- **storage-agnostic** – storage is treated as untrusted

A Concord ledger is a self-contained data structure that carries its own proof of integrity.

---

## What Concord is not

Concord is intentionally limited in scope.

It is **not**:

- a blockchain or distributed consensus system
- a network protocol
- a database replacement
- a real-time collaboration engine
- a permissions or access-control system
- a source of “truth” shared between independent parties

Concord does not attempt to create global agreement.  
It only proves internal consistency.

---

## Core idea

At its core, Concord applies a simple rule:

> Every new piece of data must cryptographically commit to everything that came before it.

This creates a chain of evidence where:

- entries cannot be reordered
- entries cannot be altered
- entries cannot be removed without detection

Verification does not require:

- a server
- a network
- a trusted clock
- a trusted storage provider

Only the data and the relevant keys.

---

## Client-side by design

Concord is designed to run entirely in client environments such as:

- browsers
- local applications
- offline-first systems

This means:

- encryption happens before data leaves the client
- signing happens before data leaves the client
- storage providers never see plaintext
- storage providers are never trusted

The system assumes storage _will_ fail, lie, or be compromised — and designs around that assumption.

---

## Typical uses

Concord is useful when you need:

- an audit trail
- tamper evidence
- offline-first data creation
- user-owned data
- long-lived records whose integrity matters

Examples include:

- personal journals or logs
- medical or wellness records
- consent or agreement histories
- configuration or state snapshots
- personal research notes

Concord is intentionally generic and does not prescribe a domain.

---

## A system, not a product

Concord is a **system and a specification**, not a commercial product.

It consists of:

- a data model
- cryptographic rules
- verification logic
- reference implementations

User interfaces, storage backends, and application logic are layered on top and are not part of the core system.

---

## Relationship to this site

This site documents:

- the Concord data model
- the cryptographic rules
- the verification process
- the reference implementations

It does not attempt to:

- sell Concord
- position it in a market
- provide guarantees beyond what the cryptography provides

Everything documented here is intended to be inspectable, reproducible, and verifiable.

---

## Summary

Concord provides a way to say:

> “This data was written in this order, has not been altered, and can be verified independently — without trusting where it was stored.”

Nothing more, and nothing less.
