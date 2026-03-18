# `@ternent/ledger` v2 Specification

## 1. Document posture

This document defines the desired target-state contract for `@ternent/ledger` v2.

It is not a compatibility document for the current `packages/ledger` runtime.
It intentionally breaks from the v1 event, plugin, and session-shaped model where that improves clarity, determinism, and boundary discipline.

`@ternent/ledger` v2 must remain:

- above protocol primitives
- below Concord runtime ergonomics
- append-only
- deterministic
- explicit about Armour and Seal composition
- storage-agnostic

## 2. Purpose

`@ternent/ledger` v2 is the append-only state engine for Concord.

It owns:

- authored truth records
- payload protection via Armour
- entry authenticity via Seal
- staging and committing
- deterministic replay
- derived projection
- persistence hooks for committed and staged truth

It does not own:

- low-level canonicalization rules
- low-level ID derivation rules
- storage-provider specifics
- app-domain command DSLs
- UI runtime concerns
- consensus or coordination
- mutable CRUD semantics

Ledger truth is append-only. Projection is derived. Storage is persistence, not authority.

## 3. Layering

### `@ternent/concord-protocol`

Protocol owns:

- canonical serialization
- deterministic derivation inputs and helpers
- commit-chain traversal
- structural validation
- epoch and encryption-key validation hooks

Protocol is the source of truth for low-level deterministic mechanics.

### `@ternent/ledger`

Ledger owns:

- authoring `LedgerEntryRecord`
- protecting payloads with Armour
- sealing entries with Seal
- staging fully formed entry records
- assembling committed truth containers
- replaying truth into projection
- verification across ledger-owned truth records
- persistence hooks

### `@ternent/concord`

Concord owns:

- command APIs
- plugin SDKs
- app-facing runtime composition
- developer templates
- higher-level product semantics

If Ledger starts looking like an app framework, that is a defect.
If Concord must rebuild append-only truth mechanics itself, that is also a defect.

## 4. Core rules

### 4.1 Append-only truth

Committed history is immutable.

### 4.2 Sealed, authored truth records

`LedgerEntryRecord` is the sealed, authored unit of truth.

Staged entries are fully formed `LedgerEntryRecord` values, not drafts and not partially authored data.

### 4.3 Encrypt payload first, then seal entry

When payload protection is used, Ledger must:

1. deterministically serialize payload input
2. encrypt the serialized bytes with Armour
3. build the entry record around the stored ciphertext form
4. derive proof-binding data from the stored ciphertext form
5. seal the entry record with Seal

Signatures and proofs bind encrypted state, not plaintext state.

### 4.4 Replay consumes ledger-owned truth

Replay always operates on ledger-owned truth records, never raw protocol entry shapes.

### 4.5 Projection is derived

Projection is always recomputed from truth records.
Projection is never a source of truth and must not be persisted as ledger truth.

### 4.6 Storage is persistence only

Storage adapters persist committed truth and staged truth only.
They do not own authority and must not persist capability context or derived projection.

## 5. Required upstream contracts

Ledger v2 depends on protocol-layer primitives but must not redefine them locally.

The minimum required upstream contract is:

- canonical payload serialization for JSON-safe values
- deterministic subject and ID derivation inputs
- commit-chain traversal helpers
- structural validation for truth containers and commit chains
- epoch and encryption-key validation hooks when encrypted history uses them

Protocol support may need to grow to satisfy Ledger v2.
This specification names those prerequisites instead of hiding them inside Ledger.

## 6. Required crypto capability contracts

### Armour boundary

Armour is the explicit payload protection boundary.

Ledger depends on Armour-capability behavior for:

- encrypting serialized payload bytes
- decrypting stored encrypted payload bytes when an explicit decrypt capability exists
- validating recipient-oriented protection inputs

Encryption must remain explicit.
Ledger must not present encryption as an implicit side effect of append semantics.

### Seal boundary

Seal is the explicit authenticity boundary.

Ledger depends on Seal-capability behavior for:

- signing the authored truth record
- returning a portable proof object
- verifying proof validity against the record subject bytes

This specification targets a future abstract Seal interface.
An implementation may initially adapt the current `@ternent/seal-cli` surface, but that adapter detail is not the primary spec contract.

## 7. Truth model

### 7.1 Ledger container

`LedgerContainer` is the committed truth container exposed by Ledger APIs.

It represents committed truth only.
Staged truth is always held separately from the committed container.

```ts
type LedgerContainer = {
  format: "concord-ledger";
  version: string;
  commits: Record<string, LedgerCommitRecord>;
  entries: Record<string, LedgerEntryRecord>;
  head: string;
};
```

### 7.2 Committed commit record

Ledger public APIs must not leak raw protocol commit shapes as their primary contract.

```ts
type LedgerCommitRecord = {
  commitId: string;
  parentCommitId: string | null;
  committedAt: string;
  metadata: Record<string, unknown> | null;
  entryIds: string[];
};
```

`commitId` derivation and commit-chain rules still come from protocol-layer determinism.

### 7.3 Entry record

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

This is the canonical ledger-owned unit of truth for both committed and staged history.

### 7.4 Payload record

```ts
type LedgerPayloadRecord =
  | {
      type: "plain";
      data: unknown;
    }
  | {
      type: "encrypted";
      scheme: "age";
      mode: "recipients";
      encoding: "armor" | "binary";
      data: string;
      payloadHash: string;
    };
```

Encrypted payload records represent the stored ciphertext form.
`payloadHash` is derived from the stored ciphertext bytes.

### 7.5 Seal proof

`SealProof` is a ledger-consumed proof value returned by the Seal capability boundary.

This spec does not lock the raw proof package surface.
It does require that the proof be stable, inspectable, and verifiable against the stored truth record subject bytes.

## 8. Public state model

```ts
type LedgerState<P> = {
  container: LedgerContainer | null;
  staged: LedgerEntryRecord[];
  projection: P;
  verification: LedgerVerificationSnapshot | null;
};
```

Rules:

- `container` holds committed truth only
- `staged` holds staged truth only
- signer state is not part of ledger truth
- decryptor state is not part of ledger truth
- projection is derived state, not persisted truth

## 9. Construction and capability context

`createLedger()` is the sole constructor.

```ts
type CreateLedgerConfig<P> = {
  identity: LedgerIdentityContext;
  protocol: LedgerProtocolContract;
  seal: LedgerSealContract;
  armour: LedgerArmourContract;
  projector: LedgerProjector<P>;
  storage?: LedgerStorageAdapter;
  now?: () => string;
  autoCommit?: boolean;
  replayPolicy?: LedgerReplayPolicy;
};
```

```ts
const ledger = await createLedger({
  identity,
  protocol,
  seal,
  armour,
  projector,
  storage,
  now,
  autoCommit,
  replayPolicy,
});
```

Capability injection is construction-time behavior, not a later auth/session mutation.

```ts
type SealSigner = unknown;
type SealProof = unknown;
type LedgerRecipientResolver = (input: {
  recipients: string[];
}) => Promise<string[]> | string[];
type LedgerDecryptor = (input: LedgerEntryRecord) => Promise<unknown>;
type LedgerReplayPolicy = {
  verify?: boolean;
  decrypt?: boolean;
};
type LedgerProtocolContract = {
  canonicalizePayload: (value: unknown) => string;
  deriveEntryId: (entry: LedgerEntryRecord) => Promise<string>;
  deriveCommitId: (commit: LedgerCommitRecord) => Promise<string>;
  getCommitChain: (container: LedgerContainer) => string[];
  validateContainer: (container: LedgerContainer) => { ok: boolean; errors: string[] };
};
type LedgerSealContract = {
  signEntry: (entry: LedgerEntryRecord) => Promise<SealProof>;
  verifyEntry: (entry: LedgerEntryRecord) => Promise<boolean>;
};
type LedgerArmourContract = {
  encrypt: (input: {
    recipients: string[];
    data: Uint8Array;
    encoding: "armor" | "binary";
  }) => Promise<{ data: string; payloadHash: string }>;
  decrypt: (entry: LedgerEntryRecord) => Promise<unknown>;
};
```

```ts
type LedgerIdentityContext = {
  signer: SealSigner;
  authorResolver: () => Promise<string> | string;
  recipientResolver?: LedgerRecipientResolver;
  decryptor?: LedgerDecryptor;
};
```

Capability context is operational context, not ledger state.

## 10. Public instance surface

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

```ts
type CreateLedgerParams = {
  metadata?: Record<string, unknown>;
};
```

Rules:

- public Ledger APIs must not expose raw protocol entry or commit shapes as their primary contracts
- `recompute()` recomputes the current projection using the default replay policy
- `replay(options?)` is the explicit replay pipeline entrypoint
- `load()` and `import()` consume committed truth containers only

## 11. Append inputs and results

```ts
type LedgerAppendInput = {
  kind: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
  protection?: LedgerProtectionInput;
};
```

```ts
type LedgerProtectionInput =
  | { type: "none" }
  | {
      type: "recipients";
      recipients: string[];
      encoding?: "armor" | "binary";
    };
```

```ts
type LedgerAppendResult = {
  entry: LedgerEntryRecord;
  stagedCount: number;
};
```

Ledger does not take app-domain permission-group semantics as append primitives.

## 12. Append lifecycle

### 12.1 Plain payload append

1. validate append input
2. deterministically normalize the plain payload input
3. build the authored truth record subject
4. seal the truth record subject
5. derive the entry ID
6. produce a fully formed `LedgerEntryRecord`
7. stage the record

### 12.2 Encrypted payload append

1. validate recipients and encoding input
2. deterministically serialize payload input
3. encrypt serialized bytes with Armour
4. compute `payloadHash` from the stored ciphertext bytes
5. build the authored truth record around the ciphertext form
6. derive the proof-binding subject from the stored ciphertext form
7. seal the truth record subject
8. derive the entry ID
9. produce a fully formed `LedgerEntryRecord`
10. stage the record

The binding target is always the actual stored ciphertext state.

## 13. Commit contract

```ts
type LedgerCommitInput = {
  metadata?: Record<string, unknown>;
};
```

```ts
type LedgerCommitResult = {
  commit: LedgerCommitRecord;
  committedEntries: LedgerEntryRecord[];
};
```

Rules:

- commit assembly uses protocol-layer chain rules
- staged entries become committed truth in deterministic staged order
- the committed container is advanced append-only
- staging is cleared only after the commit succeeds

Ledger does not expose raw protocol commit assembly as the main public contract.

## 14. Replay contract

```ts
type LedgerReplayOptions = {
  fromEntryId?: string;
  toEntryId?: string;
  verify?: boolean;
  decrypt?: boolean;
};
```

Replay order is:

1. committed commit-chain order
2. committed entry order within each commit
3. staged entries last for the in-memory current view

Replay pipeline:

1. resolve ordered ledger-owned truth records
2. optionally verify proof and container integrity
3. optionally decrypt encrypted payloads when decrypt capability exists
4. emit ledger-owned replay entries to the projector
5. compute projection

Replay never hands raw protocol entry shapes to the projector.

## 15. Replay entry shape

```ts
type LedgerReplayEntry =
  | {
      entryId: string;
      kind: string;
      author: string;
      authoredAt: string;
      meta: Record<string, unknown> | null;
      payload: { type: "plain"; data: unknown };
      verified: true;
    }
  | {
      entryId: string;
      kind: string;
      author: string;
      authoredAt: string;
      meta: Record<string, unknown> | null;
      payload: {
        type: "encrypted";
        scheme: "age";
        mode: "recipients";
        encoding: "armor" | "binary";
        data: string;
      };
      verified: true;
      decrypted: false;
    }
  | {
      entryId: string;
      kind: string;
      author: string;
      authoredAt: string;
      meta: Record<string, unknown> | null;
      payload: {
        type: "decrypted";
        original: "encrypted";
        data: unknown;
      };
      verified: true;
      decrypted: true;
    };
```

```ts
type LedgerProjector<P> = (projection: P, entry: LedgerReplayEntry) => P;
```

The projector operates on ledger-owned replay semantics, not transport or protocol primitives.

## 16. Verification contract

```ts
type LedgerVerificationSnapshot = {
  valid: boolean;
  checkedAt: string;
};
```

```ts
type LedgerVerificationResult = {
  valid: boolean;
  commitChainValid: boolean;
  entriesValid: boolean;
  payloadHashesValid: boolean;
  proofsValid: boolean;
  invalidCommitIds: string[];
  invalidEntryIds: string[];
};
```

```ts
type LedgerVerifyOptions = {
  includeProofs?: boolean;
  includePayloadHashes?: boolean;
};
```

Verification includes:

- committed container structural validation
- commit-chain integrity
- entry proof verification
- encrypted payload hash verification
- epoch and encryption-key reference validation where applicable

Verification must report invalid IDs deterministically for the stored truth being checked.

## 17. Persistence contract

```ts
type LedgerPersistenceSnapshot = {
  container: LedgerContainer | null;
  staged: LedgerEntryRecord[];
};
```

```ts
type LedgerStorageAdapter = {
  name: string;
  load(): Promise<LedgerPersistenceSnapshot | null>;
  save(snapshot: LedgerPersistenceSnapshot): Promise<void>;
  clear?(): Promise<void>;
};
```

Storage rules:

- persist committed truth and staged truth only
- do not persist projection
- do not persist signer state
- do not persist decryptor state
- do not persist verification caches as authority

## 18. Non-goals

Ledger v2 does not define:

- app-domain command DSLs
- CRUD-style mutation APIs
- UI stores
- sync orchestration services
- provider-specific storage behavior
- permission-group product semantics
- consensus
- history rewriting

## 19. Removed from v1

The following v1 concepts are intentionally not part of the v2 core contract:

- event-bus primary architecture
- plugin-based entry transforms
- plugin-based replay batch transforms
- browser-specific storage plugin model
- auth or session state inside `LedgerState`
- squash strategies as a core public API
- persisted projection

These removals are deliberate simplifications, not omissions.

## 20. Example usage

```ts
const ledger = await createLedger({
  identity,
  protocol,
  seal,
  armour,
  storage,
  projector,
});

await ledger.create();

await ledger.append({
  kind: "todo.item.created",
  payload: {
    id: "todo_123",
    title: "Buy milk",
  },
});

await ledger.append({
  kind: "journal.entry.created",
  payload: {
    text: "private note",
  },
  protection: {
    type: "recipients",
    recipients: ["age1..."],
    encoding: "armor",
  },
});

await ledger.commit({
  metadata: { reason: "user-action" },
});

await ledger.replay();

const state = ledger.getState();
```

## 21. Acceptance scenarios

### 21.1 Plain append determinism

A plain payload becomes a sealed `LedgerEntryRecord`, stages cleanly, commits cleanly, and replays identically across runs.

### 21.2 Encrypted append flow

A protected payload is serialized, encrypted, hashed as ciphertext, wrapped into a fully formed truth record, then sealed.

### 21.3 Encrypted determinism

Two separately encrypted payloads may differ at ciphertext level, but verification and replay remain deterministic for each stored encrypted record.
Entry and proof binding are always derived from the actual stored ciphertext state.

### 21.4 Replay ordering

Replay order is committed chain order, then committed entry order within each commit, then staged entries last for the in-memory current view.

### 21.5 Decryption-aware replay

Encrypted entries replay as encrypted unless an explicit decrypt capability is supplied.
Decrypted replay is capability-based and never implicit.

### 21.6 Verification failure reporting

Tampered commit links, entry content, ciphertext hashes, or proof material fail verification with stable invalid ID reporting.

### 21.7 Persistence round-trip

Export/import and storage round-trips preserve committed truth and staged truth exactly while projection is recomputed rather than restored.

### 21.8 Boundary discipline

No public API allows CRUD-style mutation of committed history, implicit encryption or signing, projection-as-truth, or storage-owned truth authority.

## 22. Definition of ready

Ledger v2 is ready when:

- it clearly sits above protocol and below Concord
- `LedgerEntryRecord` is the explicit unit of truth
- staged truth is fully authored and kept separate from committed truth
- plain and encrypted payload flows are both explicit
- encrypted payloads are protected before sealing
- replay is deterministic and reproducible
- projection is always derived
- storage persists truth only
- public APIs stay smaller and sharper than v1
- Seal and Armour remain explicit dependencies rather than hidden flags
