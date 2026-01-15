<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { LedgerContainer } from "ternent-ledger-types";

import { useLedger } from "../../module/ledger/useLedger";
import VerifyLedger from "../../module/verify/VerifyLedger.vue";

const { api, ledger, bridge } = useLedger();

const CORE_LEDGER_KEY = "concord:ledger:core";
const TAMPER_LEDGER_KEY = "concord:ledger:tamper";
const TAMPER_ACTIVE_KEY = "concord:ledger:tampered";

const ledgerText = ref("");
const parseError = ref("");
const status = ref("");
const isDirty = ref(false);
const hasCoreSnapshot = ref(false);
const hasTamperSnapshot = ref(false);

const hasLedger = computed(() => bridge.flags.value.hasLedger);

function readSnapshot(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeSnapshot(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function refreshSnapshotFlags() {
  hasCoreSnapshot.value = !!readSnapshot(CORE_LEDGER_KEY);
  hasTamperSnapshot.value = !!readSnapshot(TAMPER_LEDGER_KEY);
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

function setEditorValue(value: string, dirty = false) {
  ledgerText.value = value;
  isDirty.value = dirty;
  parseError.value = "";
}

function updateCoreSnapshotFromLedger(next: LedgerContainer | null) {
  if (!next || hasCoreSnapshot.value) return;
  writeSnapshot(CORE_LEDGER_KEY, serializeLedger(next));
  hasCoreSnapshot.value = true;
}

watch(
  ledger,
  (next) => {
    if (!isDirty.value) {
      setEditorValue(serializeLedger(next), false);
    }
    updateCoreSnapshotFromLedger(next);
  },
  { immediate: true }
);

onMounted(() => {
  refreshSnapshotFlags();
  updateCoreSnapshotFromLedger(ledger.value);
});

function onEditorInput() {
  isDirty.value = true;
  parseError.value = "";
}

async function applyTamper() {
  parseError.value = "";
  status.value = "";

  let parsed: LedgerContainer;
  try {
    parsed = JSON.parse(ledgerText.value) as LedgerContainer;
  } catch (err) {
    parseError.value = "Invalid JSON. Fix the syntax before applying.";
    return;
  }

  if (!parsed || typeof parsed !== "object") {
    parseError.value = "Ledger JSON must be an object.";
    return;
  }

  writeSnapshot(TAMPER_LEDGER_KEY, ledgerText.value);
  setTamperActive(true);
  refreshSnapshotFlags();

  await api.load(parsed, [], true, false);

  isDirty.value = false;
  status.value = "Tampered ledger applied and replayed.";
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

    setEditorValue(core, false);
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
    setEditorValue(serialized, false);
    status.value = "Reverted to persisted ledger snapshot.";
    return;
  }

  parseError.value = "No core ledger snapshot found.";
}

function loadTamperIntoEditor() {
  status.value = "";
  parseError.value = "";

  const tamper = readSnapshot(TAMPER_LEDGER_KEY);
  if (!tamper) {
    parseError.value = "No tampered ledger snapshot found.";
    return;
  }

  setEditorValue(tamper, true);
}

function updateCoreSnapshot() {
  if (!ledger.value) return;
  writeSnapshot(CORE_LEDGER_KEY, serializeLedger(ledger.value));
  refreshSnapshotFlags();
  status.value = "Core ledger snapshot updated.";
}

const canApply = computed(() => hasLedger.value && !!ledgerText.value.trim());
</script>

<template>
  <div class="mx-auto w-full max-w-160 flex flex-col flex-1 gap-4">
    <header class="sticky top-0 bg-[var(--paper)] py-2 z-10">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl">Tamper ledger.</h1>
          <p class="text-sm opacity-70">
            Edit the JSON to demonstrate how ledger tampering changes state.
          </p>
        </div>
      </div>
    </header>

    <section class="flex-1 flex flex-col gap-3 min-h-0">
      <p class="text-xs opacity-60">
        Core and tampered snapshots are stored locally so you can revert
        quickly.
      </p>
      <VerifyLedger :ledger="ledger" />
      <div class="overflow-hidden flex-1 flex flex-col">
        <textarea
          v-model="ledgerText"
          @input="onEditorInput"
          class="flex-1 w-full resize-none bg-transparent p-4 text-sm font-mono min-h-[320px]"
          spellcheck="false"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="border border-[var(--rule)] px-4 py-2 rounded-full text-xs"
          :disabled="!canApply"
          @click="applyTamper"
        >
          Apply tamper + replay
        </button>
        <button
          class="border border-[var(--rule)] px-4 py-2 rounded-full text-xs"
          :disabled="!hasCoreSnapshot"
          @click="revertToCore"
        >
          Revert to core snapshot
        </button>
        <button
          class="border border-[var(--rule)] px-4 py-2 rounded-full text-xs"
          :disabled="!hasTamperSnapshot"
          @click="loadTamperIntoEditor"
        >
          Load last tamper
        </button>
        <button
          class="border border-[var(--rule)] px-4 py-2 rounded-full text-xs"
          :disabled="!hasLedger"
          @click="updateCoreSnapshot"
        >
          Update core snapshot
        </button>
      </div>
      <p v-if="parseError" class="text-xs text-red-600">
        {{ parseError }}
      </p>
      <p v-if="status" class="text-xs opacity-60">
        {{ status }}
      </p>
    </section>
  </div>
</template>
