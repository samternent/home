import type { LedgerPlugin, StorageAdapter, PendingEntry } from "../ledger";
import type { LedgerContainer } from "@ternent/concord-protocol";

type Stored = {
  ledger: LedgerContainer;
  pending: PendingEntry[];
};

function openDB(dbName: string, storeName: string) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName))
        db.createObjectStore(storeName);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(
  dbName: string,
  storeName: string,
  key: string
): Promise<T | null> {
  const db = await openDB(dbName, storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbSet<T>(
  dbName: string,
  storeName: string,
  key: string,
  value: T
): Promise<void> {
  const db = await openDB(dbName, storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value as any, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbDel(
  dbName: string,
  storeName: string,
  key: string
): Promise<void> {
  const db = await openDB(dbName, storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export function indexedDbPlugin<P>(opts: {
  dbName?: string;
  storeName?: string;
  key?: string;
}): LedgerPlugin<P> {
  const dbName = opts.dbName ?? "concord";
  const storeName = opts.storeName ?? "ledger";
  const key = opts.key ?? "state";

  const storage: StorageAdapter<P> = {
    name: "indexeddb",

    async load() {
      return await idbGet<Stored>(dbName, storeName, key);
    },

    async save(snapshot) {
      // Keep it minimal + verifiable:
      // projection is derived, so we don’t persist it by default.
      const payload = {
        ledger: snapshot.ledger,
        pending: snapshot.pending,
      } as Stored;

      // If no ledger, clear
      if (!snapshot.ledger) {
        await idbDel(dbName, storeName, key);
        return;
      }

      await idbSet(dbName, storeName, key, payload);
    },

    async clear() {
      await idbDel(dbName, storeName, key);
    },
  };

  return {
    name: "indexeddb",
    priority: 0, // storage should be early
    storage,
  };
}
