# `@ternent/concord` Specification

## 1. Purpose

`@ternent/concord` is the developer-facing runtime for building non-custodial applications on top of `@ternent/ledger`.

Concord is command-first, but replay is the primary abstraction.

It exists to make this normal:

```ts
const app = await createConcordApp({
  identity,
  storage,
  plugins: [createTodoPlugin()],
});

await app.load();

await app.command("todo.create-item", {
  id: crypto.randomUUID(),
  title: "Buy milk",
});

await app.command("todo.rename-item", {
  id: "todo_123",
  title: "Buy oat milk",
});

await app.commit({
  metadata: {
    message: "Create and refine first todo",
  },
});
```

Commands stage domain meaning. Replay plugins consume ordered replay entries. Commits author signed history boundaries.

## 2. Layering

- `@ternent/concord-protocol` provides deterministic protocol primitives
- `@ternent/ledger` owns append-only truth, signed commits, replay, and verification
- `@ternent/concord` owns command dispatch, replay plugin hosting, and runtime composition
- framework adapters belong above Concord

Concord must never reimplement ledger truth mechanics.

## 3. Core Model

### 3.1 Truth vs runtime state

- entries are units of meaning
- signed commits are the primary authored integrity boundary
- replay-derived state is derived from replay
- replay plugins are the only replay consumer type
- storage is persistence only

### 3.2 Command and commit lifecycle

The normal Concord write lifecycle is:

1. dispatch one or more commands
2. stage one or more ledger entries
3. replay committed truth plus staged truth into replay-derived runtime state
4. explicitly commit staged entries into a signed commit
5. replay the updated committed history

Concord may support optional auto-commit hooks, but explicit commits are the default and primary model.

## 4. Public API

```ts
type ConcordApp = {
  create(params?: ConcordCreateParams): Promise<void>;
  load(): Promise<void>;

  command<TInput = unknown>(
    type: string,
    input: TInput
  ): Promise<ConcordCommandResult>;

  commit(input?: ConcordCommitInput): Promise<ConcordCommitResult>;

  replay(options?: ConcordReplayOptions): Promise<void>;
  recompute(): Promise<void>;

  verify(): Promise<LedgerVerificationResult>;

  exportLedger(): Promise<LedgerContainer>;
  importLedger(container: LedgerContainer): Promise<void>;

  getState(): Readonly<ConcordState>;
  getReplayState<T = unknown>(pluginId: string): T;

  subscribe(listener: (state: Readonly<ConcordState>) => void): () => void;
  destroy(): Promise<void>;
};
```

`ConcordAppOptions` uses:

```ts
type ConcordAppOptions = {
  identity: SerializedIdentity;
  storage?: LedgerStorageAdapter;
  plugins: ConcordReplayPlugin[];
  now?: () => string;
  protocol?: LedgerProtocolContract;
  seal?: LedgerSealContract;
  armour?: LedgerArmourContract;
  ledger?: LedgerInstance<LedgerReplayEntry[]>;
  policy?: ConcordRuntimePolicy;
};
```

Rules:

- `storage` is optional
- a supplied ledger must replay `LedgerReplayEntry[]`
- the app passes one high-level identity object
- Concord derives author, signer, and decrypt capability internally when it creates the ledger

## 5. Identity Model

```ts
type SerializedIdentity = {
  keyId: string;
  // ...
};
```

Rules:

- this is the public identity shape the app passes to Concord
- Concord internally adapts it into ledger signer / author / decryptor wiring
- command handlers receive this same high-level identity unchanged
- replay plugins do not receive ledger adaptation details

## 6. State Model

```ts
type ConcordState = {
  ready: boolean;
  integrityValid: boolean;
  stagedCount: number;
  replay: Record<string, unknown>;
  verification: LedgerVerificationResult | null;
};
```

Rules:

- `replay` is replay-derived runtime state
- `integrityValid` indicates whether the currently loaded committed history passed strict ledger verification
- `stagedCount` exposes local working-state depth without leaking raw ledger internals as the primary surface
- verification applies to the ledger artifact and current staged state, not to replay-derived state as authority
- `ready` means the app has a trustworthy projected runtime state available for normal use

## 7. Replay Plugin Model

```ts
type ConcordReplayPlugin<PState = unknown> = {
  id: string;
  initialState?: () => PState;
  commands?: Record<string, ConcordCommandHandler>;
  reset?: (ctx: ConcordReplayContext<PState>) => Promise<void> | void;
  beginReplay?: (ctx: ConcordReplayContext<PState>) => Promise<void> | void;
  applyEntry?: (
    entry: LedgerReplayEntry,
    ctx: ConcordReplayContext<PState>
  ) => Promise<void> | void;
  endReplay?: (ctx: ConcordReplayContext<PState>) => Promise<void> | void;
  destroy?: () => Promise<void> | void;
  selectors?: Record<string, (state: PState) => unknown>;
};
```

Replay context:

```ts
type ConcordReplayContext<PState = unknown> = {
  pluginId: string;
  decryptAvailable: boolean;
  replay: {
    phase: "reset" | "beginReplay" | "applyEntry" | "endReplay";
    entryIndex?: number;
    entryCount: number;
    fromEntryId?: string;
    toEntryId?: string;
    isPartial: boolean;
  };
  getState(): PState;
  setState(next: PState | ((prev: PState) => PState)): void;
};
```

Rules:

- replay plugins are the only replay consumer type
- commands return ledger append inputs
- commands stage entries; they do not implicitly define commit boundaries
- replay plugins are isolated by plugin id
- replay plugins can read and write only their own replay state during replay
- Concord does not support cross-plugin replay reads during a replay pass

`reset` has strict semantics:

- `reset` prepares plugin-local replay workspace for a new replay pass
- `reset` does not imply clearing previously published external surfaces
- external atomic swap, if needed, belongs to the plugin and usually happens in `endReplay`

`selectors` are passive metadata only. Concord does not add selector runtime behavior.

## 8. Replay Rules

Concord rebuilds runtime state with one replay pipeline:

1. verify committed history before trusted rebuild
2. ask Ledger for ordered replay entries
3. create isolated draft replay state for all plugins
4. run `reset`
5. run `beginReplay`
6. run `applyEntry` for each ordered entry
7. run `endReplay`
8. publish Concord state once after full success

Failure rules:

- abort immediately on any replay hook failure
- do not publish partial Concord state
- do not mutate the last-known-good published Concord state
- do not attempt cleanup `reset` or rollback magic

Atomicity rule:

- Concord guarantees atomicity only at the published Concord state boundary
- external surfaces owned by plugins must handle their own buffered publish / swap if they need atomic updates

## 9. Partial Replay

```ts
type ConcordReplayOptions = {
  verify?: boolean;
  decrypt?: boolean;
  fromEntryId?: string;
  toEntryId?: string;
};
```

Rules:

- replay of any ordered slice is deterministic
- replay metadata is range-aware so Concord stays compatible with timeline scrubbing and replay-slider UX
- authoritative full-state reconstruction still requires replay from genesis or a valid checkpoint

That distinction is important:

- deterministic slice replay is supported now
- authoritative full-state reconstruction from a non-zero start requires a valid checkpoint layer that Concord does not yet provide

## 10. Runtime Rules

- Concord defaults to `autoCommit: false`
- `command()` stages entries and rebuilds local replay-derived state from committed plus staged replay
- `commit()` creates a signed commit via Ledger and clears staged entries only after successful commit creation
- `verify()` validates the ledger artifact and current staged state; it does not itself replay
- `exportLedger()` exposes committed truth only
- staged truth remains visible through replayed runtime state until explicitly committed or cleared below Concord

Concord treats committed history as atomic truth.
If any committed byte in reachable history is invalid, Concord must not present replay-derived runtime state as trustworthy.

That means:

- `load()` and `importLedger()` may still succeed for diagnostic inspection
- invalid committed history forces `ready: false`
- invalid committed history forces `integrityValid: false`
- commands and commits are blocked until trustworthy runtime state exists again

## 11. Acceptance Criteria

Concord is correct when:

- multiple commands can stage multiple entries before one explicit commit
- staged state is visible through replay before commit
- committed history is advanced only by explicit commit unless auto-commit is intentionally configured
- exported ledgers show signed commit records as the authored integrity boundary
- replay plugins are the only replay consumer type
- docs and examples teach `command -> command -> commit`, not `command = commit`
- docs clearly distinguish deterministic slice replay from authoritative full-state reconstruction
