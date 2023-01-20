import { hashData } from "@concords/utils";
import {
  addRecord,
  createLedger,
  IRecord,
  mine,
} from "@concords/proof-of-work";
import { sign, exportPublicKeyAsPem } from "@concords/identity";
import type { ILedger } from "@concords/proof-of-work";
import { stripIdentityKey, generateId } from "@concords/utils";

interface ILedgerConfig {
  plugins: Array<Object>;
  ledger?: ILedger | null;
  secret?: string;
  identity?: string;
}

export interface ILedgerAPI {
  auth: Function;
  load: Function;
  create: Function;
  replay: Function;
  commit: Function;
  add: Function;
  destroy: Function;
  squashRecords: Function;
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
    ledger: ILedger | null;
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

  async function create(data = {}, difficulty = 1) {
    if (!state.publicKey || !state.signingKey) return;

    const timestamp = Date.now();
    const id = await hashData(`${timestamp}`);
    const record: IRecord = {
      id,
      timestamp,
      identity: stripIdentityKey(await exportPublicKeyAsPem(state.publicKey)),
      collection: "users",
      data,
    };

    const signature = await sign(state.signingKey, JSON.stringify(record));

    const signedRecord = {
      signature,
      ...record,
    };
    state.ledger = await createLedger(signedRecord, difficulty);
    await runHooks("onAdd", signedRecord);
    await runHooks("onCreate", state);
    await runHooks("onLoad", state);
    await runHooks("onReady", state);

    return state.ledger;
  }

  async function load(ledger: ILedger, shouldReplay = true) {
    state.ledger = ledger;
    await runHooks("onLoad", state);
    if (shouldReplay) {
      await replay();
    }
    await runHooks("onReady", state);

    return ledger;
  }

  async function add(
    data: Object,
    collection: string,
    { silent = false } = {}
  ): Promise<IRecord | void> {
    if (!state.signingKey) {
      console.warn("Cannot add record: signingKey not verified");
      return;
    }

    if (!state.publicKey) {
      console.warn("Cannot add record: signingKey not verified");
      return;
    }

    if (!state.ledger) {
      console.warn("Cannot add record: ledger not loaded");
      return;
    }

    const timestamp = Date.now();

    const record: IRecord = {
      id: "",
      data,
      timestamp,
      identity: stripIdentityKey(await exportPublicKeyAsPem(state.publicKey)),
    };

    if (collection) {
      record.collection = collection;
    }

    record.id = await hashData(record);

    const signature = await sign(state.signingKey, record);

    const signedRecord = { signature, ...record };

    state.ledger = await addRecord(signedRecord, { ...state.ledger });

    if (!silent) {
      await runHooks("onAdd", signedRecord);
      await runHooks("onUpdate", state);
    }

    return signedRecord;
  }

  async function replay(from?: string, to?: string) {
    if (!state.ledger) {
      console.warn("Cannot replay: ledger not loaded");
      return;
    }

    const { chain, pending_records } = state.ledger;

    // we want to sort this out
    //  get users forst
    // then permissions
    // then everything else in order.
    const records = [
      ...chain.map((block) => block.records).flat(),
      ...pending_records.map((r) => ({ ...r })),
    ].sort((a, b) => {
      if (a.collection === "users") {
        return -1;
      }
      if (a.collection === "permissions") {
        return -1;
      }
      return a.timestamp - b.timestamp;
    });

    let i = from ? records.findIndex(({ id }) => id === from) : 0;

    const len = to
      ? records.findIndex(({ id }) => id === to) + 1
      : records.length;

    if (i < 0) {
      console.warn(`Cannot replay: transaction ${from} not found`);
      return;
    }

    await runHooks("onBeforeReplay", { from, to });

    for (; i < len; i++) {
      await runHooks("onAdd", records[i]);
    }
    await runHooks("onReplay", { from, to, ...state });
  }

  async function destroy() {
    await runHooks("onDestroy", state);
  }

  async function commit(message: string) {
    if (!state.ledger) return;
    state.ledger = await mine(state.ledger, { message });
    await runHooks("onCommit", state);
    await runHooks("onUpdate", state);
    return state.ledger;
  }

  async function squashRecords() {
    if (!state.ledger) return;
    const lookup: {
      [key: string]: any;
    } = {};
    for (let i = 0; i < state.ledger.pending_records.length; i++) {
      const record: IRecord = state.ledger.pending_records[i];
      if (!record.collection || !record.data) return;
      lookup[`${record.data.id}_${record.collection}`] = {
        data: {
          ...(lookup[`${record.data.id}_${record.collection}`]?.data || {}),
          ...record.data,
        },
        collection: record.collection,
      };
    }

    state.ledger.pending_records = [];

    const squashedRecords: Array<Promise<IRecord>> = Object.values(lookup).map(
      (record) => {
        return new Promise(async (resolve, reject) => {
          try {
            const _record = await add(
              {
                id: generateId(),
                ...record.data,
              },
              record.collection,
              { silent: true }
            );
            if (_record) {
              resolve(_record);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    const pending_records: Array<IRecord> = await Promise.all(squashedRecords);
    state.ledger.pending_records = pending_records;
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
  };
}
