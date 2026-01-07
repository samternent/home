# Concord Protocol WASM Package

Rust implementation of the Concord protocol core, compiled to WebAssembly for JavaScript.

This package is protocol-level only and does not include user management, access control, or networking.

## Overview

This package provides the canonical Concord data structures and hashing rules in WASM:

- Canonical JSON serialization with sorted keys
- SHA-256 hashing for EntryID and CommitID
- Genesis commit and ledger creation helpers
- Commit chain traversal, replay helpers, and validation

## Installation

```bash
npm install @ternent/concord-protocol-wasm
```

## Quick Start

```typescript
import {
  create_ledger,
  derive_entry_id,
  derive_commit_id,
  get_entry_signing_payload,
} from "@ternent/concord-protocol-wasm";

const ledger = await create_ledger();
const entryId = await derive_entry_id({
  kind: "concord/user/added",
  timestamp: "2026-01-01T00:00:00Z",
  author: "author-1",
  payload: { id: "user-1" },
  signature: null,
});

const signingPayload = await get_entry_signing_payload({
  kind: "concord/user/added",
  timestamp: "2026-01-01T00:00:00Z",
  author: "author-1",
  payload: { id: "user-1" },
  signature: null,
});

const commitId = await derive_commit_id({
  parent: ledger.head,
  timestamp: "2026-01-01T00:01:00Z",
  metadata: { message: "init" },
  entries: [entryId],
});
```

## API Notes

- `EntryID` hashes the canonical entry without `signature`.
- `CommitID` hashes the full commit.
- Genesis commits are not replayed and contain no entries.
- Exports use snake_case to align with Rust conventions.
