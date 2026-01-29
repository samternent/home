<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Glyphy from "../../module/identity/Glyphy.vue";
import { useEpochs } from "../../module/epoch/useEpochs";
import { useLedger } from "../../module/ledger/useLedger";

const {
  epochs,
  currentEpoch,
  isLoading,
  lastError,
  lastPersistWarning,
  lastWarning,
  activeEpochResult,
  legacyEpochPlacement,
  canSign,
  hasSolidSession,
  generatePendingKeypair,
  commitEpoch,
} = useEpochs();
const { api, bridge } = useLedger();

const hasLedger = computed(() => bridge.flags.value.hasLedger);
const pendingCount = computed(() => bridge.flags.value.pendingCount ?? 0);
const hasPending = computed(() => pendingCount.value > 0);
const selectedEpochId = ref<string>("");

const selectedEpoch = computed(() => {
  if (!selectedEpochId.value) return null;
  return (
    epochs.value.find(
      (epoch) => epoch.record.epochId === selectedEpochId.value
    ) ?? null
  );
});

watch(
  () => epochs.value,
  (nextEpochs) => {
    if (!nextEpochs.length) {
      selectedEpochId.value = "";
      return;
    }
    const currentId = currentEpoch.value?.record.epochId;
    if (!selectedEpochId.value && currentId) {
      selectedEpochId.value = currentId;
      return;
    }
    if (
      selectedEpochId.value &&
      !nextEpochs.some(
        (epoch) => epoch.record.epochId === selectedEpochId.value
      )
    ) {
      selectedEpochId.value = currentId ?? nextEpochs[0]?.record.epochId ?? "";
    }
  },
  { immediate: true }
);

function statusLabel(epoch: (typeof epochs.value)[number]) {
  if (!epoch.isValid) return "Invalid";
  if (epoch.warnings.length) return "Warning";
  return "Valid";
}

function statusClass(epoch: (typeof epochs.value)[number]) {
  if (!epoch.isValid) return "bg-red-100 text-red-700 border-red-200";
  if (epoch.warnings.length) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function shortKey(value: string, size = 8) {
  return value ? value.slice(0, size) : "";
}

function formatDate(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

const rotateOpen = ref(false);
const rotateStep = ref<1 | 2>(1);
const pendingKeypair = ref<Awaited<ReturnType<typeof generatePendingKeypair>> | null>(null);
const rotateError = ref("");
const allowUnpersisted = ref(false);
const isRotating = ref(false);
const requiresSolidConfirm = computed(
  () => !hasSolidSession.value || rotateError.value.includes("Solid")
);
const hasForkWarning = computed(() =>
  epochs.value.some((epoch) => epoch.warnings.includes("Epoch fork detected."))
);
const hasActiveEpoch = computed(() => !!activeEpochResult.value.epoch);

function openRotate() {
  rotateOpen.value = true;
  rotateStep.value = 1;
  pendingKeypair.value = null;
  rotateError.value = "";
  allowUnpersisted.value = false;
}

function closeRotate() {
  rotateOpen.value = false;
}

async function generateKeypair() {
  rotateError.value = "";
  try {
    pendingKeypair.value = await generatePendingKeypair();
    rotateStep.value = 2;
  } catch (err) {
    rotateError.value = String(err);
  }
}

async function finalizeRotation() {
  if (!pendingKeypair.value) return;
  rotateError.value = "";
  isRotating.value = true;
  try {
    await commitEpoch({
      keypair: pendingKeypair.value,
      allowUnpersisted: allowUnpersisted.value,
    });
    closeRotate();
  } catch (err) {
    rotateError.value = String(err);
  } finally {
    isRotating.value = false;
  }
}

async function commitPendingChanges() {
  rotateError.value = "";
  if (!hasPending.value) return;
  try {
    await api.commit("Pending changes", { message: "Pending changes" });
  } catch (err) {
    rotateError.value = String(err);
    return;
  }
  if (hasPending.value) {
    rotateError.value = "Pending changes remain after commit.";
  }
}

async function discardPendingChanges() {
  rotateError.value = "";
  if (!hasPending.value) return;
  const ok = window.confirm(
    "Discard pending changes? This cannot be undone."
  );
  if (!ok) return;
  try {
    await api.api.replacePending([]);
  } catch (err) {
    rotateError.value = String(err);
    return;
  }
  if (hasPending.value) {
    rotateError.value = "Pending changes remain after discard.";
  }
}

async function copyToClipboard(value: string) {
  if (!navigator?.clipboard) return;
  await navigator.clipboard.writeText(value);
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl flex flex-col flex-1 gap-4 p-4">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl">Epochs &amp; Rotation</h1>
        <p class="text-sm opacity-70">
          Track encryption key epochs and rotate keys on demand.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="border border-[var(--rule)] px-4 py-2 rounded-full text-sm"
          :disabled="!canSign || !hasLedger || !hasActiveEpoch"
          @click="openRotate"
        >
          Rotate encryption key
        </button>
      </div>
    </header>

    <div v-if="!canSign" class="text-sm text-red-600">
      Signing key missing. Upload or create a profile to rotate keys.
    </div>

    <div v-if="hasForkWarning" class="text-sm text-yellow-700">
      Epoch fork detected. Latest valid head selected.
    </div>

    <div v-if="legacyEpochPlacement" class="text-sm text-yellow-700">
      Legacy ledger: initial epoch not in genesis.
    </div>

    <div v-if="lastWarning" class="text-sm text-yellow-700">
      {{ lastWarning }}
    </div>

    <div v-if="lastError" class="text-sm text-red-600">
      {{ lastError }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 flex-1">
      <section class="border border-[var(--rule)] rounded-xl p-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm uppercase tracking-wide opacity-60">Epoch timeline</h2>
          <span class="text-xs opacity-60">{{ epochs.length }} epochs</span>
        </div>
        <div v-if="isLoading" class="text-xs opacity-60 mt-3">
          Loading epochs...
        </div>
        <ul v-else class="mt-3 space-y-2">
          <li v-for="(epoch, index) in epochs" :key="epoch.record.epochId">
            <button
              class="w-full text-left border border-[var(--rule)] rounded-lg p-3 flex gap-3 items-start transition"
              :class="{
                'bg-[var(--paper2)]': epoch.record.epochId === selectedEpochId,
              }"
              @click="selectedEpochId = epoch.record.epochId"
            >
              <div class="size-10 rounded-lg overflow-hidden border border-[var(--rule)]">
                <Glyphy :identity="epoch.record.encryptionPublicKey" />
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-medium">Epoch {{ index + 1 }}</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full border"
                    :class="statusClass(epoch)"
                  >
                    {{ statusLabel(epoch) }}
                  </span>
                </div>
                <div class="text-xs opacity-70">
                  {{ formatDate(epoch.record.createdAt) }}
                </div>
                <div class="text-[10px] opacity-60">
                  prev: {{ shortKey(epoch.record.prevEpochId) || "none" }}
                </div>
                <div class="text-xs font-mono opacity-70">
                  {{ shortKey(epoch.record.encryptionKeyId) }}
                </div>
                <div
                  v-if="currentEpoch?.record.epochId === epoch.record.epochId"
                  class="text-[10px] uppercase tracking-wide text-emerald-600 mt-1"
                >
                  Current
                </div>
              </div>
            </button>
          </li>
          <li v-if="!epochs.length" class="text-xs opacity-60">
            No epochs yet.
          </li>
        </ul>
      </section>

      <section class="border border-[var(--rule)] rounded-xl p-4">
        <div v-if="!selectedEpoch">
          <h2 class="text-lg font-medium">Epoch unavailable</h2>
          <p class="text-sm opacity-70 mt-2">
            This ledger is missing a valid genesis epoch.
          </p>
          <div
            v-if="!activeEpochResult.ok"
            class="mt-3 text-xs text-red-600 space-y-1"
          >
            <div
              v-for="error in activeEpochResult.errors"
              :key="error.code"
            >
              {{ error.code }} — {{ error.message }}
            </div>
          </div>
        </div>
        <div v-else class="space-y-4">
          <div>
            <div class="text-xs uppercase tracking-wide opacity-60">
              Encryption key id
            </div>
            <div class="flex items-center gap-2 mt-1">
              <code class="text-xs break-all">
                {{ selectedEpoch.record.encryptionKeyId }}
              </code>
              <button
                class="text-xs border border-[var(--rule)] px-2 py-1 rounded-full"
                @click="copyToClipboard(selectedEpoch.record.encryptionKeyId)"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <div class="text-xs uppercase tracking-wide opacity-60">
              Previous epoch
            </div>
            <code class="text-xs break-all">
              {{ selectedEpoch.record.prevEpochId || "None" }}
            </code>
          </div>

          <div>
            <div class="text-xs uppercase tracking-wide opacity-60">
              Signer key id
            </div>
            <code class="text-xs break-all">
              {{ selectedEpoch.record.signerKeyId }}
            </code>
          </div>

          <div>
            <div class="text-xs uppercase tracking-wide opacity-60">
              Verification
            </div>
            <div class="text-sm">
              {{ statusLabel(selectedEpoch) }}
            </div>
            <ul
              v-if="selectedEpoch.warnings.length"
              class="mt-2 text-xs text-yellow-700 space-y-1"
            >
              <li v-for="warning in selectedEpoch.warnings" :key="warning">
                {{ warning }}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>

  <div
    v-if="rotateOpen"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
  >
    <div class="bg-[var(--paper)] border border-[var(--rule)] rounded-2xl p-6 w-full max-w-lg space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Rotate encryption key</h3>
        <button class="text-sm opacity-70" @click="closeRotate">Close</button>
      </div>

      <div class="space-y-3">
        <div class="text-xs uppercase tracking-wide opacity-60">
          Step {{ rotateStep }} of 2
        </div>

        <div v-if="hasPending" class="space-y-3">
          <p class="text-sm opacity-70">
            Commit or discard pending changes before rotating epoch.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              class="border border-[var(--rule)] px-4 py-2 rounded-full text-sm"
              :disabled="!bridge.flags.value.canWrite"
              @click="commitPendingChanges"
            >
              Commit pending changes
            </button>
            <button
              class="border border-[var(--rule)] px-4 py-2 rounded-full text-sm"
              @click="discardPendingChanges"
            >
              Discard pending changes
            </button>
          </div>
          <div class="text-xs opacity-60">
            {{ pendingCount }} pending {{ pendingCount === 1 ? "entry" : "entries" }}.
          </div>
        </div>

        <div v-else-if="rotateStep === 1" class="space-y-3">
          <p class="text-sm opacity-70">
            Generate a new encryption keypair for the next epoch.
          </p>
          <button
            class="border border-[var(--rule)] px-4 py-2 rounded-full text-sm"
            @click="generateKeypair"
          >
            Generate keypair
          </button>
        </div>

        <div v-else class="space-y-3">
          <p class="text-sm opacity-70">
            Commit the epoch record to the ledger and store the private key.
          </p>
          <div class="text-xs font-mono">
            Keypair ready. EpochId will be computed on commit.
          </div>
          <div v-if="requiresSolidConfirm" class="text-xs text-yellow-700">
            Solid backup unavailable. Proceed only if you accept local-only storage.
          </div>
          <label v-if="requiresSolidConfirm" class="flex items-center gap-2 text-xs">
            <input type="checkbox" v-model="allowUnpersisted" />
            Proceed without Solid backup
          </label>
          <button
            class="border border-[var(--rule)] px-4 py-2 rounded-full text-sm"
            :disabled="isRotating || (requiresSolidConfirm && !allowUnpersisted)"
            @click="finalizeRotation"
          >
            Commit epoch
          </button>
          <div v-if="lastPersistWarning" class="text-xs text-yellow-700">
            {{ lastPersistWarning }}
          </div>
        </div>
      </div>

      <div v-if="rotateError" class="text-xs text-red-600">
        {{ rotateError }}
      </div>
    </div>
  </div>
</template>
