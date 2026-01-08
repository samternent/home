import { computed, inject, provide, ref, shallowRef, watchEffect } from "vue";
import type { LedgerState, PendingEntry } from "ternent-ledger";

const ledgerBridgeSymbol = Symbol("ledger-bridge");

type LedgerRuntime<P> = {
  api: {
    getState: () => Readonly<LedgerState<P>>;
    subscribe: (
      listener: (state: Readonly<LedgerState<P>>) => void
    ) => () => void;
  };
};

type LokiAccess = {
  getCollection: (name: string) => any;
  getCollections?: () => Record<string, any>;
  collections?: Record<string, any>;
};

type LedgerBridge<P> = {
  api: LedgerRuntime<P>;
  state: ReturnType<typeof shallowRef<LedgerState<P>>>;
  rev: ReturnType<typeof ref<number>>;
  flags: ReturnType<typeof computed>;
  collections: {
    byKind: ReturnType<typeof shallowRef<Record<string, Record<string, any>>>>;
    idsByKind: ReturnType<typeof shallowRef<Record<string, string[]>>>;
    useArray: (kind: string) => ReturnType<typeof computed<any[]>>;
    useById: (
      kind: string,
      id: string
    ) => ReturnType<typeof computed<any | null>>;
    snapshot: (kind: string) => any[];
    get: (kind: string, id: string) => any | null;
  };
};

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function snapshotState<P>(runtime: LedgerRuntime<P>): LedgerState<P> {
  const state = runtime.api.getState();
  return {
    ledger: state.ledger ? cloneValue(state.ledger) : null,
    pending: cloneValue(state.pending ?? []),
    signingKey: state.signingKey,
    publicKey: state.publicKey,
    projection: cloneValue(state.projection),
  };
}

function getRecordId(record: any): string | null {
  const payloadId =
    record?.payload?.id ?? record?.data?.id ?? record?.entryId ?? record?.id;
  return typeof payloadId === "string" ? payloadId : null;
}

function snapshotCollection(col: any): any[] {
  if (!col) return [];
  if (typeof col.find === "function") return cloneValue(col.find());
  if (Array.isArray(col.data)) return cloneValue(col.data);
  return [];
}

function listCollections(loki?: LokiAccess): string[] {
  if (!loki) return [];
  if (loki.getCollections) {
    return Object.keys(loki.getCollections());
  }
  if (loki.collections) {
    return Object.keys(loki.collections);
  }
  return [];
}

export function createLedgerBridge<P>(
  runtime: LedgerRuntime<P>,
  options?: { loki?: LokiAccess }
): LedgerBridge<P> {
  const rev = ref(0);
  const state = shallowRef<LedgerState<P>>(snapshotState(runtime));

  const byKind = shallowRef<Record<string, Record<string, any>>>({});
  const idsByKind = shallowRef<Record<string, string[]>>({});
  const arraysByKind = shallowRef<Record<string, any[]>>({});

  const refreshCollections = () => {
    if (!options?.loki) {
      byKind.value = {};
      idsByKind.value = {};
      arraysByKind.value = {};
      return;
    }

    const nextByKind: Record<string, Record<string, any>> = {};
    const nextIdsByKind: Record<string, string[]> = {};
    const nextArraysByKind: Record<string, any[]> = {};

    for (const kind of listCollections(options.loki)) {
      const collection = options.loki.getCollection(kind);
      const records = snapshotCollection(collection);
      nextArraysByKind[kind] = records;

      const byId: Record<string, any> = {};
      const ids: string[] = [];
      for (const record of records) {
        const id = getRecordId(record);
        if (!id) continue;
        ids.push(id);
        byId[id] = record;
      }
      nextByKind[kind] = byId;
      nextIdsByKind[kind] = ids;
    }

    byKind.value = nextByKind;
    idsByKind.value = nextIdsByKind;
    arraysByKind.value = nextArraysByKind;
  };

  runtime.api.subscribe(() => {
    state.value = snapshotState(runtime);
    rev.value += 1;
    refreshCollections();
  });

  watchEffect(() => {
    rev.value;
    refreshCollections();
  });

  const flags = computed(() => {
    const snapshot = state.value;
    const pending = snapshot.pending ?? [];
    return {
      authed: !!snapshot.signingKey && !!snapshot.publicKey,
      hasLedger: !!snapshot.ledger,
      canWrite:
        !!snapshot.ledger && !!snapshot.signingKey && !!snapshot.publicKey,
      hasPending: pending.length > 0,
      pendingCount: pending.length,
    };
  });

  return {
    api: runtime,
    state,
    rev,
    flags,
    collections: {
      byKind,
      idsByKind,
      useArray: (kind: string) =>
        computed(() => arraysByKind.value[kind] ?? []),
      useById: (kind: string, id: string) =>
        computed(() => byKind.value[kind]?.[id] ?? null),
      snapshot: (kind: string) => arraysByKind.value[kind] ?? [],
      get: (kind: string, id: string) => byKind.value[kind]?.[id] ?? null,
    },
  };
}

export function provideLedgerBridge<P>(bridge: LedgerBridge<P>) {
  provide(ledgerBridgeSymbol, bridge);
}

export function useLedgerBridge<P>(): LedgerBridge<P> {
  const bridge = inject<LedgerBridge<P>>(ledgerBridgeSymbol);
  if (!bridge) {
    throw new Error("useLedgerBridge() called without provideLedgerBridge()");
  }
  return bridge;
}

export type { LedgerBridge, LedgerRuntime, LokiAccess, PendingEntry };
