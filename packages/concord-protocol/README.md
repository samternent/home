# Concord Protocol Package

TypeScript implementation of the Concord protocol core: entries, commits, and ledger containers with canonical hashing rules.

## Overview

This package provides:

- Canonical data structures for Concord ledgers
- Deterministic hashing for EntryID and CommitID
- Genesis commit creation
- Commit chain traversal helpers

Pending entries and application state are intentionally out of scope.

## Installation

```bash
npm install @ternent/concord-protocol
```

## Quick Start

```typescript
import {
  createLedger,
  deriveEntryId,
  deriveCommitId,
  getCommitChain,
  getEntrySigningPayload,
} from "@ternent/concord-protocol";

const ledger = await createLedger({ implementation: "concord-js" });

const entry = {
  kind: "concord/user/added",
  timestamp: "2026-01-01T00:00:00Z",
  author: "author-1",
  payload: { id: "user-1" },
  signature: null,
};

const entryId = await deriveEntryId(entry);
const signingPayload = getEntrySigningPayload(entry);

const chain = getCommitChain(ledger);
console.log(entryId, signingPayload, chain);
```

## API Notes

- `EntryID` excludes the `signature` field
- `CommitID` hashes the full commit structure
- Genesis commits are not replayed and contain no entries
