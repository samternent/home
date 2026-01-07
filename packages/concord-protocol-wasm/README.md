# Concord Protocol WASM Package

Rust implementation of the Concord protocol core, compiled to WebAssembly for JavaScript.

## Overview

This package provides the canonical Concord data structures and hashing rules in WASM:

- Canonical JSON serialization with sorted keys
- SHA-256 hashing for EntryID and CommitID
- Genesis commit and ledger creation helpers
- Commit chain traversal utilities

## Installation

```bash
npm install @ternent/concord-protocol-wasm
```

## Quick Start

```typescript
import {
  createLedger,
  deriveEntryId,
  deriveCommitId,
  getEntrySigningPayload,
} from "@ternent/concord-protocol-wasm";

const ledger = await createLedger();
const entryId = await deriveEntryId({
  kind: "concord/user/added",
  timestamp: "2026-01-01T00:00:00Z",
  author: "author-1",
  payload: { id: "user-1" },
  signature: null,
});

const signingPayload = await getEntrySigningPayload({
  kind: "concord/user/added",
  timestamp: "2026-01-01T00:00:00Z",
  author: "author-1",
  payload: { id: "user-1" },
  signature: null,
});

const commitId = await deriveCommitId({
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
