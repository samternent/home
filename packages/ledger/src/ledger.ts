import type {
  CommitMetadata,
  Entry,
  LedgerContainer,
} from "@ternent/concord-protocol";
import {
  createLedger,
  deriveCommitId,
  deriveEntryId,
  getCommitChain,
  getEntrySigningPayload,
  isGenesisCommit,
} from "@ternent/concord-protocol";
import { squashByIdAndKindAndResign } from "./squash";

export type EntryWithId = Entry & { entryId: string };

export type PendingEntry = {
  entryId: string;
  entry: Entry;
};

export type LedgerState<P> = {
  ledger: LedgerContainer | null;
  pending: PendingEntry[];
  signingKey: CryptoKey | null;
  publicKey: CryptoKey | null;
  projection: P;
};

export type LedgerEvent<P> =
  | {
      type: "AUTH";
      signingKey: CryptoKey;
      publicKey: CryptoKey;
      author: string;
    }
  | { type: "LOAD"; ledger: LedgerContainer; pending: PendingEntry[] }
  | { type: "READY" }
  | { type: "ADD_STAGED"; entry: EntryWithId; silent: boolean }
  | { type: "PENDING_REPLACED"; pending: PendingEntry[] }
  | {
      type: "COMMIT";
      ledger: LedgerContainer;
      message: string;
      metadata: CommitMetadata;
    }
  | { type: "REPLAY"; entries: EntryWithId[]; from?: string; to?: string }
  | { type: "PROJECTION"; projection: P }
  | { type: "DESTROY" };

export type Reducer<P> = (projection: P, entry: EntryWithId) => P;

export type EntryTransform = (
  entry: EntryWithId
) => Promise<EntryWithId | null> | (EntryWithId | null);

export type BatchTransform = (
  entries: EntryWithId[]
) => Promise<EntryWithId[]> | EntryWithId[];

export type StorageAdapter<P> = {
  name: string;

  /** Load persisted state (ledger+pending). Called by runtime.loadFromStorage(). */
  load?: () => Promise<{
    ledger: LedgerContainer;
    pending?: PendingEntry[];
  } | null>;

  /** Persist state after material changes. */
  save?: (snapshot: {
    ledger: LedgerContainer | null;
    pending: PendingEntry[];
    projection: P;
  }) => Promise<void>;

  /** Optional: clear storage */
  clear?: () => Promise<void>;
};

export type LedgerPlugin<P> = {
  name: string;
  priority?: number;

  onEvent?: (ev: LedgerEvent<P>, api: LedgerApi<P>) => void | Promise<void>;
  transformEntry?: EntryTransform;
  transformReplayBatch?: BatchTransform;

  storage?: StorageAdapter<P>;
};

export type SquashStrategy = {
  name: string;
  squash: (pending: PendingEntry[]) => Promise<PendingEntry[]> | PendingEntry[];
};

export type AuthorResolver = (publicKey: CryptoKey) => Promise<string> | string;
export type Signer = (
  signingKey: CryptoKey,
  signingPayload: ReturnType<typeof getEntrySigningPayload>
) => Promise<string> | string;

export type LedgerApi<P> = {
  getState(): Readonly<LedgerState<P>>;
  subscribe(listener: (state: Readonly<LedgerState<P>>) => void): () => void;
  recomputeProjection(persist?: boolean): Promise<P>;
  replacePending(next: PendingEntry[]): Promise<void>;
  log: (...args: any[]) => void;
};

export type GenesisEntryDraft = {
  kind: string;
  payload?: Entry["payload"];
  timestamp?: string;
};

type RuntimeConfig<P> = {
  plugins?: LedgerPlugin<P>[];
  reducer: Reducer<P>;
  initialProjection: P;
  now?: () => string;

  /** Injected identity/signing */
  resolveAuthor: AuthorResolver;
  sign: Signer;

  /** Auto-persist after changes (default true if any plugin has storage.save) */
  autoPersist?: boolean;

  /** Optional genesis entries to include at ledger creation */
  createGenesisEntries?: (params: {
    author: string;
    now: () => string;
    signingKey: CryptoKey;
    publicKey: CryptoKey;
  }) => Promise<GenesisEntryDraft[]> | GenesisEntryDraft[];
};

function sortPlugins<P>(plugins: LedgerPlugin<P>[]) {
  return [...plugins].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}

function normalizeEntry(entry: Entry): Entry {
  return { ...entry, payload: entry.payload ?? null };
}

async function stageEntry(
  ledger: LedgerContainer,
  pending: PendingEntry[],
  entry: Entry
): Promise<{ pending: PendingEntry[]; entryId: string } | null> {
  const normalized = normalizeEntry(entry);
  const entryId = await deriveEntryId(normalized);

  if (pending.some((p) => p.entryId === entryId)) return null;
  if (ledger.entries[entryId]) return null;

  return { pending: [...pending, { entryId, entry: normalized }], entryId };
}

async function commitPending(
  ledger: LedgerContainer,
  pending: PendingEntry[],
  metadata: CommitMetadata,
  timestamp: string
): Promise<LedgerContainer> {
  if (!pending.length) return ledger;

  const entryIds = pending.map((p) => p.entryId);
  const commit = {
    parent: ledger.head ?? null,
    timestamp,
    metadata: Object.keys(metadata).length ? metadata : null,
    entries: entryIds,
  };

  const commitId = await deriveCommitId(commit);

  const entries = { ...ledger.entries };
  for (const p of pending) entries[p.entryId] = p.entry;

  return {
    ...ledger,
    commits: { ...ledger.commits, [commitId]: commit },
    entries,
    head: commitId,
  };
}

function buildOrderedEntries(
  ledger: LedgerContainer,
  pending: PendingEntry[]
): EntryWithId[] {
  const chain = getCommitChain(ledger);
  const ordered: EntryWithId[] = [];

  for (const commitId of chain) {
    const commit = ledger.commits[commitId];
    if (!commit || isGenesisCommit(commit)) continue;
    for (const entryId of commit.entries) {
      const entry = ledger.entries[entryId];
      if (!entry) continue;
      ordered.push({ entryId, ...entry });
    }
  }

  for (const p of pending) {
    ordered.push({ entryId: p.entryId, ...p.entry });
  }

  return ordered;
}

export function createLedgerRuntime<P>(config: RuntimeConfig<P>) {
  const plugins = sortPlugins(config.plugins ?? []);
  const now = config.now ?? (() => new Date().toISOString());

  const storageAdapters = plugins
    .map((p) => p.storage)
    .filter(Boolean) as StorageAdapter<P>[];
  const autoPersist =
    config.autoPersist ?? storageAdapters.some((s) => !!s.save);

  const state: LedgerState<P> = {
    ledger: null,
    pending: [],
    signingKey: null,
    publicKey: null,
    projection: config.initialProjection,
  };

  const listeners = new Set<(state: Readonly<LedgerState<P>>) => void>();

  function notify() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  async function emit(ev: LedgerEvent<P>) {
    for (const p of plugins) {
      await p.onEvent?.(ev, api);
    }
  }

  async function persistIfNeeded() {
    if (!autoPersist) return;
    for (const s of storageAdapters) {
      if (s.save) {
        await s.save({
          ledger: state.ledger,
          pending: state.pending,
          projection: state.projection,
        });
      }
    }
  }

  async function applyEntryTransforms(
    entry: EntryWithId
  ): Promise<EntryWithId | null> {
    let current: EntryWithId | null = entry;
    for (const p of plugins) {
      if (!current) break;
      if (p.transformEntry) current = await p.transformEntry(current);
    }
    return current;
  }

  async function applyReplayBatchTransforms(
    entries: EntryWithId[]
  ): Promise<EntryWithId[]> {
    let current = entries;
    for (const p of plugins) {
      if (p.transformReplayBatch)
        current = await p.transformReplayBatch(current);
    }
    return current;
  }

  const api: LedgerApi<P> = {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async recomputeProjection(persist = true) {
      if (!state.ledger) {
        state.projection = config.initialProjection;
        await emit({ type: "PROJECTION", projection: state.projection });
        notify();
        if (persist) await persistIfNeeded();
        return state.projection;
      }

      const ordered = buildOrderedEntries(state.ledger, state.pending);
      const batch = await applyReplayBatchTransforms(ordered);

      let proj = config.initialProjection;
      for (const e of batch) {
        const te = await applyEntryTransforms(e);
        if (!te) continue;
        proj = config.reducer(proj, te);
      }

      state.projection = proj;
      await emit({ type: "PROJECTION", projection: proj });
      notify();
      if (persist) await persistIfNeeded();
      return proj;
    },
    async replacePending(next) {
      state.pending = next;
      await emit({ type: "PENDING_REPLACED", pending: next });
      await api.recomputeProjection();
      notify();
      await persistIfNeeded();
    },
    log: (...args) => console.log("[ledger]", ...args),
  };

  async function auth(signingKey: CryptoKey, publicKey: CryptoKey) {
    state.signingKey = signingKey;
    state.publicKey = publicKey;

    const author = await config.resolveAuthor(publicKey);
    await emit({ type: "AUTH", signingKey, publicKey, author });
    notify();
  }

  async function createLedgerInMemory(metadata: Record<string, unknown> = {}) {
    if (config.createGenesisEntries) {
      if (!state.signingKey || !state.publicKey) {
        throw new Error("Genesis entries require auth before create.");
      }
    }

    const author = state.publicKey
      ? await config.resolveAuthor(state.publicKey)
      : "";

    const genesisDrafts = config.createGenesisEntries
      ? await config.createGenesisEntries({
          author,
          now,
          signingKey: state.signingKey as CryptoKey,
          publicKey: state.publicKey as CryptoKey,
        })
      : [];

    const genesisEntries: Entry[] = [];
    for (const draft of genesisDrafts || []) {
      if (!draft?.kind) continue;
      const timestamp = draft.timestamp ?? now();
      const entryCore: Entry = {
        kind: draft.kind,
        timestamp,
        author,
        payload: draft.payload ?? null,
      };
      const signature = await config.sign(
        state.signingKey as CryptoKey,
        getEntrySigningPayload(entryCore)
      );
      genesisEntries.push({ ...entryCore, signature });
    }

    const ledger = await createLedger(
      { created_at: now(), ...metadata },
      now(),
      genesisEntries
    );
    state.ledger = ledger;
    state.pending = [];
    await emit({ type: "LOAD", ledger, pending: [] });
    await api.recomputeProjection();
    await emit({ type: "READY" });
    notify();
    await persistIfNeeded();
    return ledger;
  }

  async function load(
    ledger: LedgerContainer,
    pending: PendingEntry[] = [],
    shouldRecompute = true,
    persist = true
  ) {
    state.ledger = ledger;
    state.pending = pending;

    await emit({ type: "LOAD", ledger, pending });
    if (shouldRecompute) await api.recomputeProjection(persist);
    await emit({ type: "READY" });
    notify();
    if (persist) await persistIfNeeded();

    return { ledger, pending, projection: state.projection };
  }

  async function loadFromStorage() {
    // First adapter that returns a state wins.
    for (const s of storageAdapters) {
      if (!s.load) continue;
      const res = await s.load();
      if (res?.ledger) {
        await load(res.ledger, res.pending ?? []);
        return res;
      }
    }
    return null;
  }

  async function addAndStage(opts: {
    kind: string;
    payload: Entry["payload"];
    silent?: boolean;
    /** Optional timestamp override */
    timestamp?: string;
    /** Optional squash-by-id for specific kinds after staging */
    squashKinds?: string[];
  }): Promise<EntryWithId | null> {
    if (!state.ledger) throw new Error("Ledger not loaded");
    if (!state.signingKey || !state.publicKey) throw new Error("Not authed");
    if (!opts.kind) throw new Error("kind is required");

    const timestamp = opts.timestamp ?? now();
    const author = await config.resolveAuthor(state.publicKey);

    const entryCore: Entry = {
      kind: opts.kind,
      timestamp,
      author,
      payload: opts.payload ?? null,
    };

    const signature = await config.sign(
      state.signingKey,
      getEntrySigningPayload(entryCore)
    );

    const entry: Entry = { ...entryCore, signature };
    const staged = await stageEntry(state.ledger, state.pending, entry);
    if (!staged) return null;

    state.pending = staged.pending;
    const entryWithId: EntryWithId = { entryId: staged.entryId, ...entry };

    await emit({
      type: "ADD_STAGED",
      entry: entryWithId,
      silent: !!opts.silent,
    });

    if (opts.squashKinds?.length) {
      const nextPending = await squashByIdAndKindAndResign(state.pending, {
        kinds: opts.squashKinds,
        signingKey: state.signingKey,
        publicKey: state.publicKey,
        resolveAuthor: config.resolveAuthor,
        sign: config.sign,
        now,
        passthroughUnkeyed: true,
      });
      state.pending = nextPending;
      await emit({ type: "PENDING_REPLACED", pending: nextPending });
    }

    if (!opts.silent) {
      await api.recomputeProjection();
    }

    notify();
    await persistIfNeeded();
    return entryWithId;
  }

  async function commit(message: string, metadata: CommitMetadata) {
    if (!state.ledger) throw new Error("Ledger not loaded");

    const ledger = await commitPending(
      state.ledger,
      state.pending,
      metadata,
      now()
    );
    state.ledger = ledger;
    state.pending = [];

    await emit({ type: "COMMIT", ledger, message, metadata });
    await api.recomputeProjection();
    notify();
    await persistIfNeeded();

    return ledger;
  }

  async function replay(from?: string, to?: string) {
    if (!state.ledger) return;

    const ordered = buildOrderedEntries(state.ledger, state.pending);

    const start = from ? ordered.findIndex((e) => e.entryId === from) : 0;
    const endIndex = to
      ? ordered.findIndex((e) => e.entryId === to)
      : ordered.length - 1;

    if (start < 0) throw new Error(`from entry not found: ${from}`);
    if (to && endIndex < 0) throw new Error(`to entry not found: ${to}`);

    const slice = ordered.slice(start, endIndex + 1);
    await emit({ type: "REPLAY", entries: slice, from, to });

    await api.recomputeProjection();
    notify();
  }

  async function squash(strategy: SquashStrategy) {
    const next = await strategy.squash(state.pending);
    await api.replacePending(next);
  }

  async function destroy() {
    await emit({ type: "DESTROY" });

    state.ledger = null;
    state.pending = [];
    state.signingKey = null;
    state.publicKey = null;
    state.projection = config.initialProjection;
    notify();

    for (const s of storageAdapters) {
      await s.clear?.();
    }
  }

  async function squashByIdAndKind(opts: { kinds?: string[] } = {}) {
    if (!state.ledger) throw new Error("Ledger not loaded");
    if (!state.signingKey || !state.publicKey) throw new Error("Not authed");

    const next = await squashByIdAndKindAndResign(state.pending, {
      kinds: opts.kinds,
      signingKey: state.signingKey,
      publicKey: state.publicKey,
      resolveAuthor: config.resolveAuthor,
      sign: config.sign,
      now,
      passthroughUnkeyed: true,
    });

    await api.replacePending(next);
  }

  return {
    api,
    subscribe: api.subscribe,

    auth,
    create: createLedgerInMemory,
    load,
    loadFromStorage,

    addAndStage,

    commit,
    replay,
    squash,
    squashByIdAndKind,

    destroy,

    getLedger: () => state.ledger,
    getPending: () => state.pending,
    getProjection: () => state.projection,
  };
}
