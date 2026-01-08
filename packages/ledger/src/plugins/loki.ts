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

import { decrypt } from "ternent-encrypt";
import { formatEncryptionFile, stripIdentityKey } from "ternent-utils";

type PayloadObject = Record<string, any>;

function isPayloadObject(payload: unknown): payload is PayloadObject {
  return !!payload && typeof payload === "object" && !Array.isArray(payload);
}

function getEncryptedPayload(payload: PayloadObject): string | null {
  if (payload.enc === "age" && typeof payload.ct === "string")
    return payload.ct;
  if (typeof payload.encrypted === "string") return payload.encrypted;
  return null;
}

function getPayloadId(payload: PayloadObject): string | null {
  return typeof payload.id === "string" ? payload.id : null;
}

function hasPermissionLink(
  payload: PayloadObject
): payload is PayloadObject & { permission: string } {
  return typeof payload.permission === "string";
}

export function lokiPlugin<P>(opts: {
  name?: string;
  myPublicIdentityPem: string;
  myPrivateEncryptionKey: string;
  mapCollectionName?: (kind: string) => string;
}) {
  const db = new loki(`${opts.name ?? "ledger"}.db`, { env: "BROWSER" });
  const collections: Record<string, Collection<any>> = {};
  const myIdentity = stripIdentityKey(opts.myPublicIdentityPem);
  let currentLedger: LedgerContainer | null = null;
  let currentPending: PendingEntry[] = [];

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

  function findPermissionSecret(
    permissionTitle: string,
    identity: string
  ): string | null {
    const permCols = Object.keys(collections)
      .filter((k) => k.startsWith("concord/perm/"))
      .map((k) => collections[k]);

    for (const col of permCols) {
      const rec = col.findOne({
        "payload.title": permissionTitle,
        "payload.identity": identity,
      })?.payload;
      if (rec?.secret && typeof rec.secret === "string") return rec.secret;
    }
    return null;
  }

  async function decryptEntryIfPossible(
    entry: EntryWithId
  ): Promise<EntryWithId> {
    if (!isPayloadObject(entry.payload)) return entry;

    const payload = entry.payload;
    const encryptedPayload = getEncryptedPayload(payload);
    if (!encryptedPayload) return entry;

    try {
      if (!hasPermissionLink(payload)) {
        const clear = await decrypt(
          opts.myPrivateEncryptionKey,
          formatEncryptionFile(encryptedPayload)
        );
        return { ...entry, payload: { ...payload, ...JSON.parse(clear) } };
      }

      const permSecret = findPermissionSecret(payload.permission, myIdentity);

      if (!permSecret) {
        const clear = await decrypt(
          opts.myPrivateEncryptionKey,
          formatEncryptionFile(encryptedPayload)
        );
        return { ...entry, payload: { ...payload, ...JSON.parse(clear) } };
      }

      const sharedKey = await decrypt(
        opts.myPrivateEncryptionKey,
        formatEncryptionFile(permSecret)
      );
      const clear = await decrypt(
        sharedKey,
        formatEncryptionFile(encryptedPayload)
      );
      return { ...entry, payload: { ...payload, ...JSON.parse(clear) } };
    } catch {
      return entry;
    }
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
      upsert(e);
      upsert({ ...e, kind: "concord/all" });
    }
  }

  const plugin: LedgerPlugin<P> = {
    name: "loki",
    priority: 10,

    transformEntry: async (entry) => decryptEntryIfPossible(entry),

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
        upsert(ev.entry);
        upsert({ ...ev.entry, kind: "concord/all" });
        currentPending = [
          ...currentPending,
          { entryId: ev.entry.entryId, entry: ev.entry },
        ];
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
