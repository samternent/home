# Replay Layer

Purpose:

- turn one or more ledgers into deterministic projection output
- support replay scopes, filtering, and comparison

Phase 1 focus:

- support switching between many verified ledgers in one workspace
- keep one active projection at a time
- keep the projection contract ready for future multi-ledger composition inputs
- do not spend implementation effort on multi-ledger composition yet

Canonical contract:

```ts
type Projection<TState = unknown> = {
  id: string;
  inputs: {
    ledgerIds: string[];
    schemaIds: string[];
    filters: ReplayFilter;
    mergePolicy: "single" | "append" | "schema-defined";
  };
  state: TState;
  meta: {
    includedCommitIds: string[];
    excludedCommitIds: string[];
    verification: VerificationSummary;
  };
};
```

Own here:

- projection runners
- selectors
- replay scopes
- timeline cursors
- trust and author filters
- diff and compare helpers

Do not own here:

- route state
- Solid session logic
- app-specific widgets
