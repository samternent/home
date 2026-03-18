<script setup lang="ts">
import { computed, ref } from "vue";
import { generateId } from "ternent-utils";
import { useLedger } from "../ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import { Button } from "ternent-ui/primitives";

const { api, bridge } = useLedger();
const { privateKey: priv, publicKey: pub } = useIdentity();

const status = ref<string>("");

const state = computed(() => bridge.state.value);
const identityReady = computed(() => !!priv.value && !!pub.value);

const isAuthed = computed(() => bridge.flags.value.authed);
const hasLedger = computed(() => bridge.flags.value.hasLedger);

const pending = computed(() => state.value.pending ?? []);
const pendingCount = computed(() => pending.value.length);

const canStart = computed(() => identityReady.value);
const canWrite = computed(() => isAuthed.value && hasLedger.value);
const canCommit = computed(() => canWrite.value && pendingCount.value > 0);

async function run(label: string, fn: () => Promise<void>) {
  status.value = `${label}…`;
  try {
    await fn();
    status.value = `${label} ✅`;
  } catch (e) {
    console.error(e);
    status.value = `${label} ❌ ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function startDemo() {
  await run("Started", async () => {
    if (!priv.value || !pub.value) throw new Error("Identity not ready");
    await api.auth(priv.value, pub.value);

    // Don’t assume create() is needed; only create if none exists.
    if (!bridge.state.value.ledger) {
      await api.create();
    }
  });
}

async function addItem() {
  await run("Added item", async () => {
    if (!canWrite.value) throw new Error("Start demo first");

    const id = generateId();
    await api.addAndStage({ kind: "items", payload: { id, title: "My Item" } });
    await api.addAndStage({
      kind: "items",
      payload: { id, description: "Fragmented updates" },
    });
    await api.addAndStage({
      kind: "items",
      payload: { id, updatedAt: new Date().toISOString() },
    });
  });
}

async function commit() {
  await run("Committed", async () => {
    if (!canWrite.value) throw new Error("Start demo first");
    if (!pendingCount.value) throw new Error("Nothing to commit");

    // auto-squash keeps commits clean
    await api.squashByIdAndKind({ kinds: ["items"] });

    await api.commit("UI edit session complete", {
      message: "UI edit session complete",
    });
  });
}

async function reset() {
  await run("Reset", async () => {
    await api.destroy();
  });
}

// Helpful: merged view so you can SEE squash effect even before commit
const pendingItemsMerged = computed(() => {
  const merged: Record<string, any> = {};
  for (const p of pending.value) {
    const e = p.entry;
    if (e.kind !== "items" || !e.payload || typeof e.payload !== "object")
      continue;
    const payload: any = e.payload;
    if (typeof payload.id !== "string") continue;
    merged[payload.id] = { ...(merged[payload.id] ?? {}), ...payload };
  }
  return Object.values(merged);
});
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex gap-2 flex-wrap">
      <Button @click="startDemo" :disabled="!canStart">
        Start demo (auth + ensure ledger)
      </Button>

      <Button @click="addItem" :disabled="!canWrite">
        Add item (3 changes)
      </Button>

      <Button @click="commit" :disabled="!canCommit">
        Commit (auto-squash)
      </Button>

      <Button @click="reset"> Reset </Button>
    </div>

    <div class="text-sm opacity-80">
      {{ status }}
    </div>

    <div class="text-sm opacity-80">
      identityReady: {{ identityReady }} • authed: {{ isAuthed }} • hasLedger:
      {{ hasLedger }} • pending: {{ pendingCount }}
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <h3 class="font-bold mb-2">Pending (merged items)</h3>
        <pre
          class="bg-neutral-900 text-neutral-100 p-2 rounded text-xs max-h-72 overflow-auto"
          >{{ pendingItemsMerged }}</pre
        >
      </div>

      <div>
        <h3 class="font-bold mb-2">Pending (raw entries)</h3>
        <pre
          class="bg-neutral-900 text-neutral-100 p-2 rounded text-xs max-h-72 overflow-auto"
          >{{ pending }}</pre
        >
      </div>
    </div>

    <h3 class="font-bold">Ledger</h3>
    <pre
      class="bg-neutral-900 text-neutral-100 p-2 rounded text-xs max-h-96 overflow-auto"
      >{{ state.ledger }}</pre
    >
  </div>
</template>
