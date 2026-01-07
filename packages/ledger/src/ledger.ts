import {
  addEntry,
  commitPending,
  createLedger,
  deriveEntryId,
  Entry,
  EntryRecord,
  LedgerContainer,
  RuntimeLedger,
  getCommitChain,
  getEntrySigningPayload,
  isGenesisCommit,
} from "ternent-proof-of-work";
import { sign, exportPublicKeyAsPem } from "ternent-identity";
import { stripIdentityKey, generateId } from "ternent-utils";

interface ILedgerConfig {
  plugins: Array<Object>;
  ledger?: LedgerContainer | RuntimeLedger | null;
  secret?: string;
  identity?: string;
}

/**
 * ILedgerAPI interface definition
 */
export interface ILedgerAPI {
  auth: Function;
  load: Function;
  create: Function;
  replay: Function;
  commit: Function;
  add: Function;
  destroy: Function;
  squashRecords: Function;
  removePendingRecord: Function;
}

interface IHooks {
  [key: string]: Array<Function>;
}

type EntryWithId = Entry & { entryId: string };

function toEntryWithId(record: EntryRecord): EntryWithId {
  return {
    entryId: record.entryId,
    ...record.entry,
  };
}

function withPendingEntries(
  ledger: LedgerContainer,
  pendingEntries: EntryRecord[]
): RuntimeLedger {
  return {
    ...ledger,
    pendingEntries,
  };
}

function stripPendingEntries(ledger: LedgerContainer | RuntimeLedger) {
  return {
    format: ledger.format,
    version: ledger.version,
    commits: ledger.commits,
    entries: ledger.entries,
    head: ledger.head,
  };
}

export default function useLedger(
  config: ILedgerConfig = {
    plugins: [],
    ledger: null,
  }
): ILedgerAPI {
  const state: {
    ledger: LedgerContainer | null;
    pendingEntries: EntryRecord[];
    signingKey: CryptoKey | null;
    publicKey: CryptoKey | null;
  } = {
    ledger: null,
    pendingEntries: [],
    signingKey: null,
    publicKey: null,
  };

  const hooks: IHooks = {
    onAuth: [],
    onLoad: [],
    onReady: [],
    onCreate: [],
    onUpdate: [],
    onUnload: [],
    onBeforeReplay: [],
    onReplay: [],
    onCommit: [],
    onAdd: [],
    onDestroy: [],
  };

  config.plugins.forEach((plugin) => {
    Object.entries(plugin).forEach(([key, val]) => {
      hooks[key].push(val);
    });
  });

  async function runHooks(type: string, props = {}) {
    let i = 0;
    let len = hooks[type].length;
    for (; i < len; i++) {
      await hooks[type][i](JSON.parse(JSON.stringify(props)));
    }
  }

  async function auth(signKey: CryptoKey, verifyKey: CryptoKey) {
    state.signingKey = signKey;
    state.publicKey = verifyKey;

    await runHooks("onAuth");
  }

  async function create() {
    if (!state.publicKey || !state.signingKey) return;

    const timestamp = new Date().toISOString();
    const runtimeLedger = await createLedger({ created_at: timestamp });
    state.ledger = stripPendingEntries(runtimeLedger);
    state.pendingEntries = [];

    await runHooks("onCreate", state);
    await runHooks("onLoad", state);
    await runHooks("onReady", state);

    return state.ledger;
  }

  async function load(
    ledger: LedgerContainer | RuntimeLedger,
    shouldReplay = true
  ) {
    state.ledger = stripPendingEntries(ledger);
    state.pendingEntries =
      "pendingEntries" in ledger ? ledger.pendingEntries : [];
    await runHooks("onLoad", state);
    if (shouldReplay) {
      await replay();
    }
    await runHooks("onReady", state);

    return ledger;
  }

  async function add(
    payload: Object,
    kind: string,
    { silent = false } = {}
  ): Promise<EntryWithId | void> {
    if (!state.signingKey) {
      console.warn("Cannot add entry: signingKey not verified");
      return;
    }

    if (!state.publicKey) {
      console.warn("Cannot add entry: signingKey not verified");
      return;
    }

    if (!state.ledger) {
      console.warn("Cannot add entry: ledger not loaded");
      return;
    }

    if (!kind) {
      console.warn("Cannot add entry: kind is required");
      return;
    }

    const timestamp = new Date().toISOString();
    const author = stripIdentityKey(
      await exportPublicKeyAsPem(state.publicKey)
    );

    const entryCore: Entry = {
      kind,
      timestamp,
      author,
      payload: payload ?? null,
    };

    const entryId = await deriveEntryId(entryCore);
    const signature = await sign(
      state.signingKey,
      getEntrySigningPayload(entryCore)
    );

    const entry: Entry = {
      ...entryCore,
      signature,
    };

    const runtimeLedger = await addEntry(
      entry,
      withPendingEntries(state.ledger, state.pendingEntries)
    );
    state.pendingEntries = runtimeLedger.pendingEntries;
    const record = toEntryWithId({ entryId, entry });

    if (!silent) {
      await runHooks("onAdd", record);
      await runHooks("onUpdate", state);
    }

    return record;
  }

  async function replay(from?: string, to?: string) {
    if (!state.ledger) {
      console.warn("Cannot replay: ledger not loaded");
      return;
    }

    const { commits, entries } = state.ledger;
    const chain = getCommitChain(state.ledger);

    const orderedEntries: EntryWithId[] = [];
    for (const commitId of chain) {
      const commit = commits[commitId];
      if (!commit || isGenesisCommit(commit)) {
        continue;
      }
      for (const entryId of commit.entries) {
        const entry = entries[entryId];
        if (!entry) continue;
        orderedEntries.push({ entryId, ...entry });
      }
    }

    for (const pending of state.pendingEntries) {
      orderedEntries.push(toEntryWithId(pending));
    }

    let i = from
      ? orderedEntries.findIndex(({ entryId }) => entryId === from)
      : 0;

    const len = to
      ? orderedEntries.findIndex(({ entryId }) => entryId === to) + 1
      : orderedEntries.length;

    if (i < 0) {
      console.warn(`Cannot replay: transaction ${from} not found`);
      return;
    }

    await runHooks("onBeforeReplay", { from, to });

    for (; i < len; i++) {
      await runHooks("onAdd", orderedEntries[i]);
    }
    await runHooks("onReplay", { from, to, ...state });
  }

  async function destroy() {
    await runHooks("onDestroy", state);
  }

  async function commit(message: string) {
    if (!state.ledger || !state.publicKey || !state.signingKey) return;

    const author = stripIdentityKey(
      await exportPublicKeyAsPem(state.publicKey)
    );
    const runtimeLedger = await commitPending(
      withPendingEntries(state.ledger, state.pendingEntries),
      {
        author,
        message,
      }
    );
    state.ledger = stripPendingEntries(runtimeLedger);
    state.pendingEntries = [];
    await runHooks("onCommit", state);
    await runHooks("onUpdate", state);
    return state.ledger;
  }

  async function removePendingRecord(record: EntryWithId) {
    if (!state.ledger) return;
    const index = state.pendingEntries.findIndex(
      (pending) => pending.entryId === record.entryId
    );
    if (index < 0) {
      return state.ledger;
    }

    state.pendingEntries.splice(index, 1);
    await destroy();
    await replay();
    await runHooks("onUpdate", state);
    return state.ledger;
  }

  async function squashRecords() {
    if (!state.ledger) return;
    const lookup: {
      [key: string]: any;
    } = {};

    for (let i = 0; i < state.pendingEntries.length; i++) {
      const record = state.pendingEntries[i];
      const entry = record.entry;
      if (!entry.kind || !entry.payload) return;
      const payload = entry.payload as { id?: string; [key: string]: any };
      if (!payload.id) return;
      lookup[`${payload.id}_${entry.kind}`] = {
        payload: {
          ...(lookup[`${payload.id}_${entry.kind}`]?.payload || {}),
          ...payload,
        },
        kind: entry.kind,
      };
    }

    state.pendingEntries = [];

    const squashedEntries: Array<Promise<EntryWithId>> = Object.values(
      lookup
    ).map((entry) => {
      return new Promise(async (resolve, reject) => {
        try {
          const _entry = await add(
            {
              id: generateId(),
              ...entry.payload,
            },
            entry.kind,
            { silent: true }
          );
          if (_entry) {
            resolve(_entry);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    const pendingEntries: Array<EntryWithId> = await Promise.all(
      squashedEntries
    );
    state.pendingEntries = pendingEntries.map((record) => ({
      entryId: record.entryId,
      entry: {
        kind: record.kind,
        timestamp: record.timestamp,
        author: record.author,
        payload: record.payload,
        signature: record.signature,
      },
    }));
    await runHooks("onUpdate", state);
  }

  return {
    auth,
    load,
    create,
    replay,
    commit,
    add,
    destroy,
    squashRecords,
    removePendingRecord,
  };
}
