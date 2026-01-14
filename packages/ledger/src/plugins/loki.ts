import loki from "lokijs";
import type { Collection } from "lokijs";
import type {
  EntryWithId,
  LedgerPlugin,
  LedgerEvent,
  PendingEntry,
} from "../ledger";
import { getCommitChain, isGenesisCommit } from "@ternent/concord-protocol";
import type { LedgerContainer } from "@ternent/concord-protocol";

type PayloadObject = Record<string, any>;

function isPayloadObject(payload: unknown): payload is PayloadObject {
  return !!payload && typeof payload === "object" && !Array.isArray(payload);
}

function getPayloadId(payload: PayloadObject): string | null {
  return typeof payload.id === "string" ? payload.id : null;
}

export function lokiPlugin<P>(opts: {
  name?: string;
  mapCollectionName?: (kind: string) => string;
  transformEntry?: (
    entry: EntryWithId
  ) => Promise<EntryWithId | null> | EntryWithId | null;
  bootstrapKinds?: string[];
}) {
  const db = new loki(`${opts.name ?? "ledger"}.db`, { env: "BROWSER" });
  const collections: Record<string, Collection<any>> = {};
  let currentLedger: LedgerContainer | null = null;
  let currentPending: PendingEntry[] = [];
  const bootstrapKinds = new Set(opts.bootstrapKinds ?? []);

  function getOrCreateCollection(kind: string) {
    const colName = opts.mapCollectionName?.(kind) ?? kind;
    if (!collections[colName]) {
      collections[colName] = db.addCollection(colName, { disableMeta: true });
    }
    return collections[colName];
  }

  function reset() {
    for (const key of Object.keys(collections)) {
      db.removeCollection(key);
      delete collections[key];
    }
  }

  async function transformEntryIfNeeded(
    entry: EntryWithId
  ): Promise<EntryWithId | null> {
    if (!opts.transformEntry) return entry;
    return opts.transformEntry(entry);
  }

  function toLokiDoc<T extends Record<string, any>>(obj: T): T {
    const { $loki, meta, ...rest } = obj as any;
    // clone to ensure Loki never mutates runtime objects
    return JSON.parse(JSON.stringify(rest));
  }

  function toRecord(entry: EntryWithId) {
    const payload = isPayloadObject(entry.payload)
      ? toLokiDoc(entry.payload)
      : null;
    return {
      entryId: entry.entryId,
      kind: entry.kind,
      timestamp: entry.timestamp,
      author: entry.author,
      identity: entry.author,
      signature: entry.signature ?? null,
      payload,
      data: payload ? toLokiDoc(payload) : null,
    };
  }

  function upsert(entry: EntryWithId) {
    const kind = entry.kind || "concord/unknown";
    const col = getOrCreateCollection(kind);

    const doc = toLokiDoc(toRecord(entry));

    const payloadId = isPayloadObject(doc.payload)
      ? getPayloadId(doc.payload)
      : null;

    if (payloadId) {
      const existing = col.findOne({ "payload.id": payloadId });
      if (existing) {
        col.update({ ...existing, ...doc });
        return;
      }
    }

    col.insert(doc);
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

  async function rebuildFromState() {
    if (!currentLedger) return;
    reset();
    getOrCreateCollection("concord/all");
    const entries = buildOrderedEntries(currentLedger, currentPending);
    for (const e of entries) {
      if (!bootstrapKinds.has(e.kind)) continue;
      const transformed = await transformEntryIfNeeded(e);
      if (!transformed) continue;
      upsert(transformed);
      upsert({ ...transformed, kind: "concord/all" });
    }
    for (const e of entries) {
      if (bootstrapKinds.has(e.kind)) continue;
      const transformed = await transformEntryIfNeeded(e);
      if (!transformed) continue;
      upsert(transformed);
      upsert({ ...transformed, kind: "concord/all" });
    }
  }

  const plugin: LedgerPlugin<P> = {
    name: "loki",
    priority: 10,

    onEvent: async (ev: LedgerEvent<P>) => {
      if (ev.type === "LOAD") {
        currentLedger = ev.ledger;
        currentPending = ev.pending ?? [];
        await rebuildFromState();
      }

      if (ev.type === "REPLAY") {
        await rebuildFromState();
      }

      if (ev.type === "ADD_STAGED") {
        const transformed = await transformEntryIfNeeded(ev.entry);
        if (!transformed) return;
        upsert(transformed);
        upsert({ ...transformed, kind: "concord/all" });
        currentPending = [
          ...currentPending,
          { entryId: ev.entry.entryId, entry: ev.entry },
        ];
        if (bootstrapKinds.has(ev.entry.kind)) {
          await rebuildFromState();
        }
      }

      if (ev.type === "PENDING_REPLACED") {
        currentPending = ev.pending;
        await rebuildFromState();
      }

      if (ev.type === "COMMIT") {
        currentLedger = ev.ledger;
        currentPending = [];
        await rebuildFromState();
      }

      if (ev.type === "DESTROY") {
        currentLedger = null;
        currentPending = [];
        reset();
      }
    },
  };

  return {
    db,
    collections,
    getCollection: (name: string) => collections[name],
    getCollections: () => collections,
    plugin,
  };
}
