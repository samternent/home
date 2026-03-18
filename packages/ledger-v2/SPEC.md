# `@ternent/ledger` v2 Specification

## 1. Purpose

`@ternent/ledger` is the append-only truth engine beneath Concord.

It owns:

- staged and committed truth
- entry authoring
- signed commit authoring
- deterministic replay
- verification of commit linkage, commit proofs, entry proofs, and payload hashes
- persistence of committed truth plus staged truth

It does not own:

- app-domain command APIs
- framework runtime behavior
- storage authority
- mutable CRUD semantics

## 2. Architectural thesis

The corrected Ledger model is:

- entries are units of meaning
- commits are the primary authored integrity boundary
- commits are signed
- each commit references the previous commit id
- chain integrity is carried by signed commits plus parent linkage
- staged and committed truth remain explicit

Entry-level authenticity is not sufficient to define the integrity of the full ledger history.
Entries carry meaning. Signed commits carry authored history integrity.

## 3. Layering

- `@ternent/concord-protocol` owns deterministic canonicalization and commit-chain traversal helpers
- `@ternent/ledger` owns staged/committed truth, signed commits, replay, and verification
- `@ternent/concord` owns command ergonomics and plugin projection above Ledger

## 4. Truth model

### 4.1 Container

```ts
type LedgerContainer = {
  format: "concord-ledger";
  version: "1";
  commits: Record<string, LedgerCommitRecord>;
  entries: Record<string, LedgerEntryRecord>;
  head: string;
};
```

The container exposes committed truth only.
Staged truth is held separately.

### 4.2 Entry record

```ts
type LedgerEntryRecord = {
  entryId: string;
  kind: string;
  authoredAt: string;
  author: string;
  meta: Record<string, unknown> | null;
  payload: LedgerPayloadRecord;
  seal: SealProof;
};
```

Entries are the smallest unit of meaning.
They may carry plaintext or encrypted payloads.
They may be individually sealed.

### 4.3 Commit record

```ts
type LedgerCommitRecord = {
  commitId: string;
  parentCommitId: string | null;
  committedAt: string;
  metadata: Record<string, unknown> | null;
  entryIds: string[];
  seal: SealProof;
};
```

Commits are first-class authored records.
They are signed records, not unsigned grouping metadata.

## 5. Signed commit model

### 5.1 Unsigned commit subject

Ledger must centralize construction of the unsigned commit subject.

The unsigned commit subject includes:

- `parentCommitId`
- `committedAt`
- `metadata`
- ordered `entryIds`

It excludes:

- `commitId`
- `seal`
- any circular self-reference

### 5.2 Commit id derivation and signing

Commit creation must follow this order:

1. build the canonical unsigned commit subject
2. derive `commitId` from that unsigned canonical subject
3. sign the same unsigned canonical subject bytes
4. attach the resulting proof as `seal`

Commit proof bytes must never participate in commit id derivation.

## 6. Append and commit behavior

### 6.1 Append

```ts
append(input: LedgerAppendInput): Promise<LedgerAppendResult>;
appendMany(inputs: LedgerAppendInput[]): Promise<LedgerAppendResult[]>;
```

Append stages fully formed `LedgerEntryRecord` values.

Append does not mutate committed history.

### 6.2 Commit

```ts
type LedgerCommitInput = {
  metadata?: Record<string, unknown>;
};

type LedgerCommitResult = {
  commit: LedgerCommitRecord;
  committedEntries: LedgerEntryRecord[];
  committedEntryIds: string[];
};
```

Rules:

- `commit()` fails when no staged entries exist
- staged entries are grouped in deterministic staged order
- the new commit signs the unsigned commit subject
- the committed chain advances only after successful signed commit creation
- staged entries clear only after commit success

## 7. Replay

```ts
replay(options?: LedgerReplayOptions): Promise<P>;
```

Replay order is:

1. committed commits in chain order
2. committed entries in commit order
3. staged entries last for the in-memory working view

Replay produces derived projection only.
Projection is never persisted as truth.

## 8. Verification

```ts
type LedgerVerificationResult = {
  valid: boolean;
  committedHistoryValid: boolean;
  commitChainValid: boolean;
  commitProofsValid: boolean;
  entriesValid: boolean;
  entryProofsValid: boolean;
  payloadHashesValid: boolean;
  proofsValid: boolean;
  invalidCommitIds: string[];
  invalidEntryIds: string[];
};
```

Verification must validate:

- committed container structure
- commit-chain linkage
- commit id derivation from unsigned commit subjects
- commit proof validity against unsigned commit subject bytes
- entry id derivation
- entry proof validity
- encrypted payload hashes when present

`commitChainValid` remains a structural diagnostic about commit linkage and commit id derivation.
`committedHistoryValid` is the strict integrity boundary for the reachable committed document.

`committedHistoryValid` is true only if:

- reachable commit linkage is valid
- reachable commit proofs are valid
- all entries referenced by reachable commits are present and valid
- all encrypted payload hashes for reachable committed entries are valid

`valid` must equal `committedHistoryValid`.

That means any invalid committed byte in reachable history makes the entire document globally invalid, even though verification still reports a precise local breakdown through the other fields.

The combined `proofsValid` field is the conjunction of commit-proof and entry-proof validity.

## 9. Public API

```ts
type LedgerInstance<P> = {
  create(params?: CreateLedgerParams): Promise<void>;
  load(container: LedgerContainer): Promise<void>;
  loadFromStorage(): Promise<boolean>;

  append(input: LedgerAppendInput): Promise<LedgerAppendResult>;
  appendMany(inputs: LedgerAppendInput[]): Promise<LedgerAppendResult[]>;
  commit(input?: LedgerCommitInput): Promise<LedgerCommitResult>;

  replay(options?: LedgerReplayOptions): Promise<P>;
  recompute(): Promise<P>;
  verify(options?: LedgerVerifyOptions): Promise<LedgerVerificationResult>;

  export(): Promise<LedgerContainer>;
  import(container: LedgerContainer): Promise<void>;

  getState(): Readonly<LedgerState<P>>;
  subscribe(listener: (state: Readonly<LedgerState<P>>) => void): () => void;
  clearStaged(): Promise<void>;
  destroy(): Promise<void>;
};
```

## 10. State and persistence

```ts
type LedgerState<P> = {
  container: LedgerContainer | null;
  staged: LedgerEntryRecord[];
  projection: P;
  verification: LedgerVerificationSnapshot | null;
};
```

Storage persists:

- committed container
- staged entries

Storage does not persist:

- projection
- signer or decryptor capability context
- verification caches as authority

## 11. Example lifecycle

```ts
await ledger.create({
  metadata: {
    surface: "workspace",
  },
});

await ledger.append({
  kind: "todo.item.created",
  payload: { id: "todo_123", title: "Buy milk" },
});

await ledger.append({
  kind: "todo.item.renamed",
  payload: { id: "todo_123", title: "Buy oat milk" },
});

await ledger.commit({
  metadata: {
    message: "Create and refine first todo",
  },
});

const projection = await ledger.replay();
const verification = await ledger.verify();
const exported = await ledger.export();
```

## 12. Acceptance criteria

Ledger is correct when:

- commit ids derive from unsigned commit subjects only
- commit proofs validate against those same unsigned commit subject bytes
- tampering with parent linkage or commit content fails verification
- staged entries remain uncommitted until explicit commit
- replay order remains committed history first, staged truth last
- exported ledgers show signed commit records as the authored chain boundary
