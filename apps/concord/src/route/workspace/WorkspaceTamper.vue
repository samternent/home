<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { LedgerContainer } from "ternent-ledger-types";
import { STreeView } from "ternent-ui/components";

import { useLedger } from "../../module/ledger/useLedger";

const { api, ledger, bridge } = useLedger();

const CORE_LEDGER_KEY = "concord:ledger:core";
const TAMPER_LEDGER_KEY = "concord:ledger:tamper";
const TAMPER_ACTIVE_KEY = "concord:ledger:tampered";
const TAMPER_HISTORY_KEY = "concord:ledger:tamper:history";
const TAMPER_HISTORY_INDEX_KEY = "concord:ledger:tamper:history:index";

const ledgerText = ref("");
const parseError = ref("");
const status = ref("");
const isDirty = ref(false);
const hasCoreSnapshot = ref(false);
const history = ref<string[]>([]);
const historyIndex = ref(-1);
const isApplying = ref(false);

let suppressLedgerWatch = false;
let applyTimer: number | undefined;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type TreeNode = {
  id: string;
  label: string;
  meta?: string;
  value?: string;
  rawValue?: JsonValue;
  children?: TreeNode[];
};

function readSnapshot(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeSnapshot(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function readHistory() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(TAMPER_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readHistoryIndex() {
  if (typeof window === "undefined") return -1;
  const raw = window.localStorage.getItem(TAMPER_HISTORY_INDEX_KEY);
  const parsed = raw ? Number(raw) : -1;
  return Number.isInteger(parsed) ? parsed : -1;
}

function writeHistory(nextHistory: string[], nextIndex: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TAMPER_HISTORY_KEY, JSON.stringify(nextHistory));
  window.localStorage.setItem(TAMPER_HISTORY_INDEX_KEY, String(nextIndex));
}

function refreshSnapshotFlags() {
  hasCoreSnapshot.value = !!readSnapshot(CORE_LEDGER_KEY);
}

function setTamperActive(isActive: boolean) {
  if (typeof window === "undefined") return;
  if (isActive) {
    window.localStorage.setItem(TAMPER_ACTIVE_KEY, "true");
    return;
  }
  window.localStorage.removeItem(TAMPER_ACTIVE_KEY);
}

function serializeLedger(value: LedgerContainer | null) {
  if (!value) return "";
  return JSON.stringify(value, null, 2);
}

function formatValue(value: JsonValue) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) return "null";
  return String(value);
}

function truncate(value: string, max = 48) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function buildTreeNode(
  label: string,
  value: JsonValue,
  path: string
): TreeNode {
  if (Array.isArray(value)) {
    return {
      id: path,
      label,
      meta: `${value.length} items`,
      children: value.map((child, index) =>
        buildTreeNode(`[${index}]`, child, `${path}/${index}`)
      ),
    };
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    return {
      id: path,
      label,
      meta: `${entries.length} keys`,
      children: entries.map(([key, child]) =>
        buildTreeNode(key, child, `${path}/${key}`)
      ),
    };
  }

  return {
    id: path,
    label,
    value: truncate(formatValue(value)),
    rawValue: value,
  };
}

function updateLedgerValue(
  root: JsonValue,
  path: string,
  nextValue: JsonValue
): boolean {
  const segments = path.split("/");
  if (segments.length < 2) return false;

  let parent: JsonValue = root;
  for (let index = 1; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (Array.isArray(parent)) {
      const numericIndex = Number(segment);
      if (!Number.isInteger(numericIndex)) return false;
      parent = parent[numericIndex] as JsonValue;
    } else if (parent && typeof parent === "object") {
      parent = (parent as Record<string, JsonValue>)[segment];
    } else {
      return false;
    }
  }

  const key = segments[segments.length - 1];
  if (Array.isArray(parent)) {
    const numericIndex = Number(key);
    if (!Number.isInteger(numericIndex)) return false;
    parent[numericIndex] = nextValue;
    return true;
  }

  if (!parent || typeof parent !== "object") {
    return false;
  }

  const record = parent as Record<string, JsonValue>;
  if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
  record[key] = nextValue;
  return true;
}

function setEditorValue(value: string, dirty = false, suppress = false) {
  if (suppress) suppressLedgerWatch = true;
  ledgerText.value = value;
  isDirty.value = dirty;
  parseError.value = "";
}

function updateCoreSnapshotFromLedger(next: LedgerContainer | null) {
  if (!next || hasCoreSnapshot.value) return;
  writeSnapshot(CORE_LEDGER_KEY, serializeLedger(next));
  hasCoreSnapshot.value = true;
}

onMounted(() => {
  refreshSnapshotFlags();
  updateCoreSnapshotFromLedger(ledger.value);
  const storedHistory = readHistory();
  const storedIndex = readHistoryIndex();
  history.value = storedHistory;
  historyIndex.value =
    storedIndex >= 0 && storedIndex < storedHistory.length ? storedIndex : -1;

  const tamper = readSnapshot(TAMPER_LEDGER_KEY);
  if (tamper) {
    setEditorValue(tamper, true, true);
    setTamperActive(true);
    refreshSnapshotFlags();
  } else if (ledger.value) {
    setEditorValue(serializeLedger(ledger.value), false, true);
  }

  if (!history.value.length) {
    const seed = tamper ?? serializeLedger(ledger.value);
    if (seed) {
      history.value = [seed];
      historyIndex.value = 0;
      writeHistory(history.value, historyIndex.value);
    }
  }
});

function queueApply(value: string) {
  if (applyTimer) window.clearTimeout(applyTimer);
  applyTimer = window.setTimeout(async () => {
    parseError.value = "";
    status.value = "";

    let parsed: LedgerContainer;
    try {
      parsed = JSON.parse(value) as LedgerContainer;
    } catch {
      parseError.value = "Invalid JSON. Fix the syntax before applying.";
      return;
    }

    if (!parsed || typeof parsed !== "object") {
      parseError.value = "Ledger JSON must be an object.";
      return;
    }

    isApplying.value = true;
    try {
      await api.load(parsed, [], true, false);
      status.value = "Tamper changes applied.";
    } finally {
      isApplying.value = false;
    }
  }, 300);
}

function recordTamperChange(value: string, options: { apply?: boolean } = {}) {
  writeSnapshot(TAMPER_LEDGER_KEY, value);
  setTamperActive(true);
  refreshSnapshotFlags();

  const nextHistory =
    historyIndex.value < history.value.length - 1
      ? history.value.slice(0, historyIndex.value + 1)
      : [...history.value];

  if (nextHistory[nextHistory.length - 1] !== value) {
    nextHistory.push(value);
  }

  history.value = nextHistory;
  historyIndex.value = nextHistory.length - 1;
  writeHistory(history.value, historyIndex.value);

  if (options.apply !== false) {
    queueApply(value);
  }
}

async function revertToCore() {
  status.value = "";
  parseError.value = "";

  const core = readSnapshot(CORE_LEDGER_KEY);
  if (core) {
    let parsed: LedgerContainer;
    try {
      parsed = JSON.parse(core) as LedgerContainer;
    } catch {
      parseError.value = "Stored core ledger is invalid JSON.";
      return;
    }

    await api.load(parsed, [], true, true);
    setTamperActive(false);

    setEditorValue(core, false, true);
    status.value = "Reverted to core ledger snapshot.";
    return;
  }

  const stored = await api.loadFromStorage();
  if (stored?.ledger) {
    const serialized = serializeLedger(stored.ledger);
    writeSnapshot(CORE_LEDGER_KEY, serialized);
    refreshSnapshotFlags();
    setTamperActive(false);
    // loadFromStorage already refreshes state
    setEditorValue(serialized, false, true);
    status.value = "Reverted to persisted ledger snapshot.";
    return;
  }

  parseError.value = "No core ledger snapshot found.";
}

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(
  () => historyIndex.value >= 0 && historyIndex.value < history.value.length - 1
);

const treeState = computed(() => {
  if (!ledgerText.value.trim()) {
    return {
      nodes: [] as TreeNode[],
      error: "No ledger snapshot to preview yet.",
    };
  }

  try {
    const parsed = JSON.parse(ledgerText.value) as JsonValue;
    return {
      nodes: [buildTreeNode("Ledger", parsed, "ledger")],
      error: "",
    };
  } catch {
    return {
      nodes: [] as TreeNode[],
      error: "Invalid JSON. Fix the syntax to preview the tree.",
    };
  }
});

function parseEditedValue(input: string): JsonValue {
  const trimmed = input.trim();
  if (trimmed === "") return "";
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(trimmed) as JsonValue;
  } catch {
    return input;
  }
  return parsed;
}

function onTreeValueChange(payload: { path: string; raw: string }) {
  const nextValue = parseEditedValue(payload.raw);

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(ledgerText.value) as JsonValue;
  } catch {
    parseError.value = "Invalid JSON. Fix the syntax before editing.";
    return;
  }

  if (!parsed || typeof parsed !== "object") {
    parseError.value = "Ledger JSON must be an object.";
    return;
  }

  const updated = updateLedgerValue(parsed, payload.path, nextValue);
  if (!updated) {
    parseError.value = "Edit failed. Path invalid.";
    return;
  }

  const nextText = JSON.stringify(parsed, null, 2);
  setEditorValue(nextText, true, true);
  recordTamperChange(nextText);
}

watch(
  ledger,
  (next) => {
    if (suppressLedgerWatch) {
      suppressLedgerWatch = false;
      return;
    }
    if (isApplying.value) return;
    updateCoreSnapshotFromLedger(next);
    const serialized = serializeLedger(next);
    if (!serialized) return;
    setEditorValue(serialized, true, true);
    recordTamperChange(serialized, { apply: false });
  },
  { immediate: true }
);

function undoChange() {
  if (!canUndo.value) return;
  const nextIndex = historyIndex.value - 1;
  const nextValue = history.value[nextIndex];
  historyIndex.value = nextIndex;
  writeHistory(history.value, historyIndex.value);
  setEditorValue(nextValue, true, true);
  writeSnapshot(TAMPER_LEDGER_KEY, nextValue);
  setTamperActive(true);
  refreshSnapshotFlags();
  queueApply(nextValue);
}

function redoChange() {
  if (!canRedo.value) return;
  const nextIndex = historyIndex.value + 1;
  const nextValue = history.value[nextIndex];
  historyIndex.value = nextIndex;
  writeHistory(history.value, historyIndex.value);
  setEditorValue(nextValue, true, true);
  writeSnapshot(TAMPER_LEDGER_KEY, nextValue);
  setTamperActive(true);
  refreshSnapshotFlags();
  queueApply(nextValue);
}

watch(ledgerText, (next) => {
  if (suppressLedgerWatch) {
    suppressLedgerWatch = false;
    return;
  }
  if (isApplying.value) return;
  if (!next.trim()) return;
  isDirty.value = true;
  parseError.value = "";
  recordTamperChange(next);
});
</script>

<template>
  <div class="mx-auto w-full flex flex-col flex-1 h-full">
    <header
      class="sticky top-0 bg-[var(--ui-bg)] p-2 flex items-center z-10 justify-between"
    >
      <div class="flex flex-wrap items-center gap-2 sticky bottom-0">
        <button
          class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-xs"
          :disabled="!canUndo"
          @click="undoChange"
        >
          Undo
        </button>
        <button
          class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-xs"
          :disabled="!canRedo"
          @click="redoChange"
        >
          Redo
        </button>
        <button
          class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-xs"
          :disabled="!hasCoreSnapshot"
          @click="revertToCore"
        >
          Revert to core snapshot
        </button>
      </div>
      <p v-if="parseError" class="text-xs text-red-600">
        {{ parseError }}
      </p>
      <p v-if="status" class="text-xs opacity-60">
        {{ status }}
      </p>
    </header>

    <div class="overflow-hidden flex flex-col w-full min-h-0 flex-1 font-mono">
      <div
        class="flex-1 overflow-auto p-3 bg-[var(--ui-surface)] border-t border-[var(--ui-border)]"
      >
        <STreeView
          v-if="treeState.nodes.length"
          :nodes="treeState.nodes"
          :default-expanded-depth="2"
          editable-values
          aria-label="Ledger tree view"
          @value-change="onTreeValueChange"
          text-size="xs"
        />
        <p v-else class="text-xs opacity-60">{{ treeState.error }}</p>
      </div>
    </div>
  </div>
</template>
