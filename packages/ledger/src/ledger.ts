import {
  addEntry,
  commitPending,
  ConcordLedger,
  createLedger,
  deriveEntryId,
  Entry,
  RuntimeLedger,
} from "ternent-proof-of-work";
import { sign, exportPublicKeyAsPem } from "ternent-identity";
import { stripIdentityKey, generateId } from "ternent-utils";

interface ILedgerConfig {
  plugins: Array<Object>;
  ledger?: RuntimeLedger | ConcordLedger | null;
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

export default function useLedger(
  config: ILedgerConfig = {
    plugins: [],
    ledger: null,
  }
): ILedgerAPI {
  const state: {
    ledger: RuntimeLedger | null;
    signingKey: CryptoKey | null;
    publicKey: CryptoKey | null;
  } = {
    ledger: null,
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

  async function create(payload = {}) {
    if (!state.publicKey || !state.signingKey) return;

    const time = Date.now();
    const author = stripIdentityKey(await exportPublicKeyAsPem(state.publicKey));

    const entryCore = {
      kind: "concord/user/added",
      time,
      author,
      payload,
    };

    const entryId = await deriveEntryId(entryCore);
    const sig = await sign(state.signingKey, entryId);

    const entry: Entry = {
      entryId,
      sig,
      ...entryCore,
    };

    state.ledger = await createLedger(entry, { author, time });
    await runHooks("onAdd", entry);
    await runHooks("onCreate", state);
    await runHooks("onLoad", state);
    await runHooks("onReady", state);

    return state.ledger;
  }

  async function load(
    ledger: RuntimeLedger | ConcordLedger,
    shouldReplay = true
  ) {
    state.ledger = {
      ...ledger,
      pendingEntries: "pendingEntries" in ledger ? ledger.pendingEntries : [],
    };
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
  ): Promise<Entry | void> {
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

    const time = Date.now();
    const author = stripIdentityKey(await exportPublicKeyAsPem(state.publicKey));

    const entryCore = {
      kind,
      time,
      author,
      payload,
    };

    const entryId = await deriveEntryId(entryCore);
    const sig = await sign(state.signingKey, entryId);

    const entry: Entry = {
      entryId,
      sig,
      ...entryCore,
    };

    state.ledger = await addEntry(entry, { ...state.ledger });

    if (!silent) {
      await runHooks("onAdd", entry);
      await runHooks("onUpdate", state);
    }

    return entry;
  }

  async function replay(from?: string, to?: string) {
    if (!state.ledger) {
      console.warn("Cannot replay: ledger not loaded");
      return;
    }

    const { commits, pendingEntries } = state.ledger;

    const entries = [
      ...commits.flatMap((commit) => commit.entries),
      ...pendingEntries.map((entry) => ({ ...entry })),
    ].sort((a, b) => {
      const aPriority =
        a.kind === "concord/user/added"
          ? 0
          : a.kind.startsWith("concord/perm/")
          ? 1
          : 2;
      const bPriority =
        b.kind === "concord/user/added"
          ? 0
          : b.kind.startsWith("concord/perm/")
          ? 1
          : 2;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      if (a.time !== b.time) {
        return a.time - b.time;
      }
      return a.entryId.localeCompare(b.entryId);
    });

    let i = from ? entries.findIndex(({ entryId }) => entryId === from) : 0;

    const len = to
      ? entries.findIndex(({ entryId }) => entryId === to) + 1
      : entries.length;

    if (i < 0) {
      console.warn(`Cannot replay: transaction ${from} not found`);
      return;
    }

    await runHooks("onBeforeReplay", { from, to });

    for (; i < len; i++) {
      await runHooks("onAdd", entries[i]);
    }
    await runHooks("onReplay", { from, to, ...state });
  }

  async function destroy() {
    await runHooks("onDestroy", state);
  }

  async function commit(message: string) {
    if (!state.ledger || !state.publicKey || !state.signingKey) return;

    const author = stripIdentityKey(await exportPublicKeyAsPem(state.publicKey));
    state.ledger = await commitPending(state.ledger, {
      author,
      message,
    });
    await runHooks("onCommit", state);
    await runHooks("onUpdate", state);
    return state.ledger;
  }

  async function removePendingRecord(entry: Entry) {
    if (!state.ledger) return;
    const index = state.ledger.pendingEntries.findIndex(
      (pending) => pending.entryId === entry.entryId
    );
    if (index < 0) {
      return state.ledger;
    }

    state.ledger.pendingEntries.splice(index, 1);
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

    for (let i = 0; i < state.ledger.pendingEntries.length; i++) {
      const entry: Entry = state.ledger.pendingEntries[i];
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

    state.ledger.pendingEntries = [];

    const squashedEntries: Array<Promise<Entry>> = Object.values(lookup).map(
      (entry) => {
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
      }
    );

    const pendingEntries: Array<Entry> = await Promise.all(squashedEntries);
    state.ledger.pendingEntries = pendingEntries;
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
