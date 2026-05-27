import { computed, ref, type ComputedRef } from "vue";

export type ConcordOsWorkingCopyChange = {
  id: string;
  message: string;
  stagedCount: number;
  createdAt: string;
};

export type ConcordOsWorkingCopyCommitAdapter<TEntity> = {
  clearStaged(): Promise<void>;
  putEntity(entity: TEntity): Promise<void>;
  deleteEntity(id: string): Promise<void>;
  commit(message: string): Promise<void>;
};

export type ConcordOsWorkingCopyOptions<TEntity extends { id: string }> = {
  sort(items: Record<string, TEntity>): TEntity[];
  equal(left: TEntity, right: TEntity): boolean;
  normalize(entity: TEntity): TEntity;
};

export type ConcordOsWorkingCopy<TEntity extends { id: string }> = {
  items: ComputedRef<TEntity[]>;
  stagedCount: ComputedRef<number>;
  pendingTransactions: ComputedRef<ConcordOsWorkingCopyChange[]>;
  saving: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  lastAction: ComputedRef<string | null>;
  commitMessage: ComputedRef<string>;
  loadCommitted(items: TEntity[]): void;
  reset(): void;
  setCommitMessage(value: string): void;
  stagePut(message: string, entity: TEntity): void;
  stageDelete(message: string, id: string): void;
  commitPending(adapter: ConcordOsWorkingCopyCommitAdapter<TEntity>): Promise<boolean>;
};

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown working copy error.");
}

function buildCommitMessage(label: string): string {
  return label.trim() || "Update staged work";
}

export function createConcordOsWorkingCopy<TEntity extends { id: string }>(
  options: ConcordOsWorkingCopyOptions<TEntity>,
): ConcordOsWorkingCopy<TEntity> {
  const committedItemsState = ref<TEntity[]>([]);
  const itemsState = ref<TEntity[]>([]);
  const dirtyItemsState = ref<Record<string, TEntity | null>>({});
  const pendingTransactionsState = ref<ConcordOsWorkingCopyChange[]>([]);
  const stagedCountState = ref(0);
  const savingState = ref(false);
  const errorState = ref<string | null>(null);
  const lastActionState = ref<string | null>(null);
  const commitMessageState = ref("");

  function sortItems(items: Record<string, TEntity>): TEntity[] {
    return options.sort(items);
  }

  function getCommittedMap(): Record<string, TEntity> {
    return Object.fromEntries(
      committedItemsState.value.map((item) => [item.id, options.normalize(item)]),
    );
  }

  function getWorkingMap(): Record<string, TEntity> {
    return Object.fromEntries(itemsState.value.map((item) => [item.id, options.normalize(item)]));
  }

  function setWorkingMap(map: Record<string, TEntity>) {
    itemsState.value = sortItems(map);
  }

  function applyDirtyOverlay(baseItems: TEntity[], dirty = dirtyItemsState.value): TEntity[] {
    const map = Object.fromEntries(baseItems.map((item) => [item.id, options.normalize(item)]));
    for (const [id, next] of Object.entries(dirty)) {
      if (next === null) {
        delete map[id];
      } else {
        map[id] = options.normalize(next);
      }
    }

    return sortItems(map);
  }

  function updateDirtyItem(id: string, next: TEntity | null) {
    const committed = getCommittedMap();
    const dirty = { ...dirtyItemsState.value };
    const normalizedNext = next ? options.normalize(next) : null;
    const committedItem = committed[id];

    if (!committedItem && normalizedNext === null) {
      delete dirty[id];
    } else if (committedItem && normalizedNext && options.equal(committedItem, normalizedNext)) {
      delete dirty[id];
    } else if (!committedItem && normalizedNext) {
      dirty[id] = normalizedNext;
    } else if (committedItem && normalizedNext === null) {
      dirty[id] = null;
    } else if (normalizedNext) {
      dirty[id] = normalizedNext;
    }

    dirtyItemsState.value = dirty;
    stagedCountState.value = Object.keys(dirty).length;
  }

  function recordPendingTransaction(message: string) {
    if (stagedCountState.value === 0) {
      pendingTransactionsState.value = [];
      return;
    }

    pendingTransactionsState.value = [
      ...pendingTransactionsState.value,
      {
        id: crypto.randomUUID(),
        message: buildCommitMessage(message),
        stagedCount: stagedCountState.value,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  return {
    items: computed(() => itemsState.value),
    stagedCount: computed(() => stagedCountState.value),
    pendingTransactions: computed(() => pendingTransactionsState.value),
    saving: computed(() => savingState.value),
    error: computed(() => errorState.value),
    lastAction: computed(() => lastActionState.value),
    commitMessage: computed(() => commitMessageState.value),
    loadCommitted(items) {
      committedItemsState.value = items.map((item) => options.normalize(item));
      itemsState.value = applyDirtyOverlay(committedItemsState.value);
    },
    reset() {
      committedItemsState.value = [];
      itemsState.value = [];
      dirtyItemsState.value = {};
      pendingTransactionsState.value = [];
      stagedCountState.value = 0;
      savingState.value = false;
      errorState.value = null;
      lastActionState.value = null;
      commitMessageState.value = "";
    },
    setCommitMessage(value: string) {
      commitMessageState.value = value;
    },
    stagePut(message, entity) {
      errorState.value = null;
      const normalized = options.normalize(entity);
      const working = getWorkingMap();
      working[normalized.id] = normalized;
      updateDirtyItem(normalized.id, normalized);
      setWorkingMap(working);
      lastActionState.value = buildCommitMessage(message);
      recordPendingTransaction(message);
    },
    stageDelete(message, id) {
      errorState.value = null;
      const working = getWorkingMap();
      delete working[id];
      updateDirtyItem(id, null);
      setWorkingMap(working);
      lastActionState.value = buildCommitMessage(message);
      recordPendingTransaction(message);
    },
    async commitPending(adapter) {
      const dirtyEntries = Object.entries(dirtyItemsState.value).sort(([left], [right]) =>
        left.localeCompare(right),
      );
      if (dirtyEntries.length === 0) {
        return true;
      }

      savingState.value = true;
      errorState.value = null;

      try {
        const pendingCount = pendingTransactionsState.value.length;
        const latestPendingMessage =
          pendingCount > 0 ? pendingTransactionsState.value[pendingCount - 1]?.message : null;
        const commitMessage =
          commitMessageState.value.trim() ||
          latestPendingMessage ||
          `Commit ${stagedCountState.value} staged change${stagedCountState.value === 1 ? "" : "s"}`;

        await adapter.clearStaged();
        for (const [id, entity] of dirtyEntries) {
          if (entity) {
            await adapter.putEntity(options.normalize(entity));
          } else {
            await adapter.deleteEntity(id);
          }
        }
        await adapter.commit(commitMessage);

        dirtyItemsState.value = {};
        pendingTransactionsState.value = [];
        stagedCountState.value = 0;
        commitMessageState.value = "";
        committedItemsState.value = itemsState.value.map((item) => options.normalize(item));
        lastActionState.value =
          pendingCount > 0
            ? `Committed ${pendingCount} pending change${pendingCount === 1 ? "" : "s"}`
            : "Committed staged changes";
        return true;
      } catch (error) {
        errorState.value = normalizeMessage(error);
        await adapter.clearStaged().catch(() => undefined);
        itemsState.value = applyDirtyOverlay(committedItemsState.value);
        return false;
      } finally {
        savingState.value = false;
      }
    },
  };
}
