# `@ternent/concord` Specification

## 1. Purpose

`@ternent/concord` is the developer-facing runtime for building non-custodial applications on top of `@ternent/ledger`.

Concord is command-first, but it is not auto-commit-first.

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

Commands stage domain meaning. Commits author signed history boundaries.

## 2. Layering

- `@ternent/concord-protocol` provides deterministic protocol primitives
- `@ternent/ledger` owns append-only truth, signed commits, replay, and verification
- `@ternent/concord` owns command dispatch, plugin projection, and runtime composition
- framework adapters belong above Concord

Concord must never reimplement ledger truth mechanics.

## 3. Core model

### 3.1 Truth vs runtime state

- entries are units of meaning
- signed commits are the primary authored integrity boundary
- plugin state is derived from replay
- projection targets are derived from replay
- storage is persistence only

### 3.2 Command and commit lifecycle

The normal Concord write lifecycle is:

1. dispatch one or more commands
2. stage one or more ledger entries
3. replay committed truth plus staged truth into projected app state
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
  getPluginState<T = unknown>(pluginId: string): T;

  subscribe(listener: (state: Readonly<ConcordState>) => void): () => void;
  destroy(): Promise<void>;
};
```

## 5. State model

```ts
type ConcordState = {
  ready: boolean;
  integrityValid: boolean;
  stagedCount: number;
  plugins: Record<string, unknown>;
  verification: LedgerVerificationResult | null;
};
```

Rules:

- `plugins` is replay-derived app state
- `integrityValid` indicates whether the currently loaded committed history passed strict ledger verification
- `stagedCount` exposes local working-state depth without leaking raw ledger internals as the primary surface
- verification applies to the ledger artifact and current staged state, not to plugin state as authority
- `ready` means the app has a trustworthy projected runtime state available for normal use

## 6. Plugin model

```ts
type ConcordPlugin<PState = unknown> = {
  id: string;
  initialState(): PState;
  commands?: Record<
    string,
    (
      ctx: ConcordCommandContext,
      input: unknown
    ) => Promise<LedgerAppendInput | LedgerAppendInput[]> | LedgerAppendInput | LedgerAppendInput[]
  >;
  project(
    state: PState,
    entry: LedgerReplayEntry,
    ctx: ConcordProjectionContext
  ): PState;
  selectors?: Record<string, (state: PState) => unknown>;
};
```

Rules:

- commands return ledger append inputs
- commands stage entries; they do not implicitly define commit boundaries
- `project()` is a pure replay consumer over the plugin state slice and replay entry
- plugins define domain meaning, not truth mechanics

## 7. Projection targets

Projection targets consume replay output after plugin state is rebuilt for the current entry.

They:

- consume replayed truth
- may materialize query stores
- do not author truth
- do not replace plugin projection

Projection target failures fail the Concord operation. They are not swallowed.

## 8. Runtime rules

- Concord defaults to `autoCommit: false`
- `command()` stages entries and rebuilds local projected state from committed plus staged replay
- `commit()` creates a signed commit via Ledger and clears staged entries only after successful commit creation
- `verify()` validates the ledger artifact and current staged state; it does not itself replay
- `exportLedger()` exposes committed truth only
- staged truth remains visible through replayed app state until explicitly committed or cleared below Concord

Concord treats committed history as atomic truth.
If any committed byte in reachable history is invalid, Concord must not present projected state as trustworthy runtime state.

That means:

- `load()` and `importLedger()` may still succeed for diagnostic inspection
- invalid committed history forces `ready: false`
- invalid committed history forces `integrityValid: false`
- commands and commits are blocked until trustworthy runtime state exists again

## 9. Acceptance criteria

Concord is correct when:

- multiple commands can stage multiple entries before one explicit commit
- staged state is visible through replay before commit
- committed history is advanced only by explicit commit unless auto-commit is intentionally configured
- exported ledgers show signed commit records as the authored integrity boundary
- docs and examples teach `command -> command -> commit`, not `command = commit`
