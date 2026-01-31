# SPEC 00 — Concord Layering, Semantics, and Conformance

File: specs/00-layering-and-conformance.md  
Status: Normative  
Version: 0.2

## Purpose

Define the Concord “core vs semantics” boundary and provide conformance levels that match how the system is intended to be implemented: core protocol is minimal; identity/permissions/encryption are expressed as ledger data and interpreted by deterministic replay.

This spec exists to prevent accidental “baking semantics into core” while still allowing official, portable semantics.

## Design Principle

- The ledger is an append-only event log.
- “Tables” (users, permissions, etc.) are materialized views derived by replay.
- Core protocol validates structure, canonicalization, hashing, and replay ordering only.
- All meaning (identity, permissions, encryption) is introduced by semantic layers that define entry kinds and deterministic reducers.

## Layers

### Layer L1 — Core Protocol

Responsibilities:

- LedgerContainer / Commit / Entry shapes
- Canonicalization + hash addressing
- Commit graph rules
- Deterministic replay ordering

Non-responsibilities:

- Signature verification
- Identity resolution
- Key rotation semantics
- Permissions / authorization
- Encryption

Core treats Entry.kind as opaque.

### Layer L2 — Semantic Tables (Identity, Permissions, Encryption)

Responsibilities:

- Define entry kinds that represent rows/updates
- Replay reducers that materialize state maps
- Validation rules that are deterministic from the ledger state
- Optional signature verification and policy enforcement

Semantic layers may be shipped as “official plugins” but remain separate from core.

## Conformance Levels

| Level | Name               | Minimum Requirements                                         |
| ----- | ------------------ | ------------------------------------------------------------ |
| L1    | Protocol-compliant | Structural + hash validity and deterministic replay ordering |
| L2-I  | Identity-aware     | Deterministic principal registry (age recipients + metadata) |
| L2-P  | Permission-aware   | Deterministic permission state + can()                       |
| L3    | Tooling-complete   | CLI/CI/Web tooling that enforces L2 rules                    |

## Normative Statement on Rotation

“Key rotation” is a semantic concept expressed via normal entries and replay rules. It is not a core protocol primitive.

- Identity “rotation” is achieved via successive identity entries.
