# SPEC 01 — Concord Core Protocol v1.0

File: specs/01-core-protocol.md  
Status: Normative  
Version: 1.0

## Purpose

Define the core protocol invariants as implemented by @ternent/concord-protocol.

This spec intentionally does not interpret Entry.kind or payload semantics.

## Data Model

### LedgerContainer

Fields:

- format: literal string "concord-ledger"
- version: literal string "1.0"
- commits: map commitId → Commit
- entries: map entryId → Entry
- head: commitId

### Entry

Fields:

- kind: string
- timestamp: ISO-8601 string
- author: string
- payload: JSON value (object recommended; may be null)
- signature: string or null (optional; opaque to core)

### Commit

Fields:

- parent: commitId or null
- timestamp: ISO-8601 string
- metadata: JSON object or null (optional)
- entries: array of entryIds, ordered

## Canonicalization

The canonical representation used for hashing must be deterministic:

- stable key ordering
- no whitespace dependence
- stable string encoding (UTF-8)
- no NaN/Infinity (JSON-compatible only)

## Hashing / IDs

- entryId is SHA-256 hex of canonical Entry
- commitId is SHA-256 hex of canonical Commit
- LedgerContainer is not hashed as a single unit; it is a container of hash-addressed objects.

## Commit Graph Rules

- Each commit references at most one parent (single-parent chain in v1.0).
- Genesis commit has parent = null.
- head must reference an existing commit.
- Every commit entryId referenced in commit.entries must exist in ledger.entries.

## Deterministic Replay Ordering

Replay order is:

1. Resolve commit chain from genesis → head by following parent pointers.
2. For each commit in order, apply entries in the order listed in commit.entries.

Core does not impose any additional semantics.

## Explicit Non-Responsibilities

Core does not:

- Verify signature correctness
- Resolve author → public keys
- Validate permissions
- Encrypt or decrypt payloads
- Interpret entry kinds
