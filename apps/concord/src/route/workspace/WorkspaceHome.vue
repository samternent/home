<script setup lang="ts">
import { onMounted, computed, shallowRef, ref, watch } from "vue";
import { LedgerContainer } from "ternent-ledger-types";
import {
  getDefaultSession,
  handleIncomingRedirect,
} from "@inrupt/solid-client-authn-browser";
import {
  getContainedResourceUrlAll,
  getFile,
  getPodUrlAll,
  getSolidDataset,
} from "@inrupt/solid-client";

import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import AppLayout from "../../module/app/AppLayout.vue";
import SideNav from "../../module/side-nav/SideNav.vue";
import WorkspaceConsole from "../../module/workspace/Console.vue";
import sampleLedger from "./sample-ledger.json";

defineProps({
  workspaceId: {
    type: String,
    required: false,
  },
});

const { api, bridge, ledger } = useLedger();
const { privateKey: priv, publicKey: pub } = useIdentity();

const CORE_LEDGER_KEY = "concord:ledger:core";
const TAMPER_ACTIVE_KEY = "concord:ledger:tampered";
const loading = shallowRef(true);
const uploadInputRef = shallowRef<HTMLInputElement | null>(null);
const solidSession = getDefaultSession();
const oidcIssuer = ref("https://login.inrupt.com");
const solidStatus = ref("");
const solidError = ref("");
const podUrls = ref<string[]>([]);
const selectedPod = ref("");
const privacy = ref<"private" | "public" | "shared">("private");
const ledgerFiles = ref<{ url: string; name: string }[]>([]);
const selectedLedgerUrl = ref("");

onMounted(async () => {
  loading.value = true;
  let loaded = false;
  if (typeof window !== "undefined") {
    const tamperActive =
      window.localStorage.getItem(TAMPER_ACTIVE_KEY) === "true";
    const coreSnapshot = window.localStorage.getItem(CORE_LEDGER_KEY);
    if (tamperActive && coreSnapshot) {
      try {
        const parsed = JSON.parse(coreSnapshot) as LedgerContainer;
        await api.load(parsed, [], true, true);
        window.localStorage.removeItem(TAMPER_ACTIVE_KEY);
        loaded = true;
      } catch {
        window.localStorage.removeItem(TAMPER_ACTIVE_KEY);
      }
    }
  }

  if (!loaded) {
    await api.loadFromStorage();
  }
  await api.auth(priv.value!, pub.value!);
  loading.value = false;
  await handleSolidRedirect();
});

const hasLedger = computed(() => bridge.flags.value.hasLedger);
const solidLoggedIn = computed(() => solidSession.info.isLoggedIn === true);

const containerUrl = computed(() => {
  if (!selectedPod.value) return "";
  return new URL(`concord/ledgers/${privacy.value}/`, selectedPod.value)
    .toString()
    .trim();
});

async function createNewLedger() {
  if (priv.value && pub.value) {
    await api.auth(priv.value, pub.value);
  }
  await api.create();
}

async function loadSampleLedger() {
  await api.load(sampleLedger as LedgerContainer, [], true);
}

function triggerLedgerUpload() {
  uploadInputRef.value?.click();
}

async function handleLedgerUpload(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.files?.length) return;
  const file = target.files[0];
  target.value = "";

  let parsed: LedgerContainer;
  try {
    parsed = JSON.parse(await file.text()) as LedgerContainer;
  } catch {
    window.alert("Invalid ledger JSON.");
    return;
  }

  await api.load(parsed, [], true, true);
}

async function handleSolidRedirect() {
  if (typeof window === "undefined") return;
  await handleIncomingRedirect({ restorePreviousSession: true });
  if (solidSession.info.isLoggedIn) {
    await loadPods();
  }
}

async function loginToSolid() {
  solidError.value = "";
  if (!oidcIssuer.value.trim()) {
    solidError.value = "Provide an OIDC issuer to sign in.";
    return;
  }
  await solidSession.login({
    oidcIssuer: oidcIssuer.value.trim(),
    redirectUrl: `${window.location.origin}/workspace`,
    clientName: "Concord",
  });
}

async function logoutFromSolid() {
  await solidSession.logout();
  podUrls.value = [];
  selectedPod.value = "";
  ledgerFiles.value = [];
  selectedLedgerUrl.value = "";
  solidStatus.value = "Logged out of Solid.";
}

async function loadPods() {
  if (!solidSession.info.webId) return;
  solidError.value = "";
  try {
    solidStatus.value = "Loading pod storage...";
    const pods = await getPodUrlAll(solidSession.info.webId, {
      fetch: solidSession.fetch,
    });
    podUrls.value = pods;
    selectedPod.value = pods[0] ?? "";
    solidStatus.value = pods.length ? "Pod storage loaded." : "No pods found.";
    if (selectedPod.value) {
      await refreshSolidLedgers();
    }
  } catch (err) {
    solidError.value = `Failed to load pod storage: ${String(err)}`;
  }
}

async function refreshSolidLedgers() {
  if (!containerUrl.value) return;
  solidError.value = "";
  try {
    solidStatus.value = "Loading ledgers from pod...";
    const dataset = await getSolidDataset(containerUrl.value, {
      fetch: solidSession.fetch,
    });
    const urls = getContainedResourceUrlAll(dataset).filter(
      (url) => !url.endsWith("/")
    );
    ledgerFiles.value = urls.map((url) => ({
      url,
      name: url.split("/").pop() || url,
    }));
    solidStatus.value = "Ledgers loaded.";
  } catch (err: any) {
    const statusCode = err?.statusCode ?? err?.status;
    if (statusCode === 404) {
      ledgerFiles.value = [];
      solidStatus.value = "No container found for this privacy level.";
    } else {
      solidError.value = `Failed to load ledgers: ${String(err)}`;
    }
  }
}

async function loadLedgerFromSolid() {
  if (!selectedLedgerUrl.value) return;
  solidError.value = "";
  try {
    solidStatus.value = "Loading ledger from pod...";
    const file = await getFile(selectedLedgerUrl.value, {
      fetch: solidSession.fetch,
    });
    const text = await file.text();
    const parsed = JSON.parse(text) as LedgerContainer;
    await api.load(parsed, [], true, true);
    await api.auth(priv.value!, pub.value!);
    solidStatus.value = "Ledger loaded into workspace.";
  } catch (err) {
    solidError.value = `Failed to load ledger: ${String(err)}`;
  }
}

watch([selectedPod, privacy], async () => {
  ledgerFiles.value = [];
  selectedLedgerUrl.value = "";
  solidStatus.value = "";
  solidError.value = "";
  if (!selectedPod.value || !solidLoggedIn.value) return;
  await refreshSolidLedgers();
});
</script>
<template>
  <TransitionGroup name="slow-swap">
    <div
      v-if="loading"
      class="text-sm opacity-70 flex-1 flex w-full h-screen items-center justify-center bg-[var(--ui-surface)]"
    ></div>
    <AppLayout v-else>
      <template #left-side> <SideNav /> </template>

      <div class="p-4 flex flex-1 h-full">
        <div class="w-full">
          <RouterView v-if="hasLedger" />
          <div v-else class="space-y-6 max-w-3xl">
            <div
              class="border border-[var(--ui-border)] rounded-xl p-4 space-y-3 text-sm"
            >
              <h2 class="text-base font-medium">Workspace ledger</h2>
              <div class="space-y-3">
                <p>No ledger found in this workspace.</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
                    @click="createNewLedger"
                  >
                    Create new ledger
                  </button>
                  <button
                    class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
                    @click="triggerLedgerUpload"
                  >
                    Upload ledger
                  </button>
                  <button
                    class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
                    @click="loadSampleLedger"
                  >
                    Load sample ledger
                  </button>
                </div>
                <input
                  ref="uploadInputRef"
                  type="file"
                  accept="application/json"
                  class="hidden"
                  @change="handleLedgerUpload"
                />
              </div>
            </div>

            <div
              class="border border-[var(--ui-border)] rounded-xl p-4 space-y-4 text-sm"
            >
              <h2 class="text-base font-medium">Solid pod ledger import</h2>
              <div v-if="!solidLoggedIn" class="space-y-3">
                <label class="block text-sm">
                  OIDC issuer
                  <input
                    v-model="oidcIssuer"
                    list="solid-issuers"
                    class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
                    placeholder="https://login.inrupt.com"
                  />
                </label>
                <datalist id="solid-issuers">
                  <option value="https://login.inrupt.com" />
                  <option value="https://broker.pod.inrupt.com" />
                  <option value="https://solidcommunity.net" />
                </datalist>
                <button
                  class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
                  @click="loginToSolid"
                >
                  Connect to Solid
                </button>
              </div>

              <div v-else class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <button
                    class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
                    @click="logoutFromSolid"
                  >
                    Disconnect
                  </button>
                  <button
                    class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
                    @click="loadPods"
                  >
                    Refresh pods
                  </button>
                </div>
                <label class="block">
                  Pod storage root
                  <select
                    v-model="selectedPod"
                    class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="" disabled>Select a pod</option>
                    <option v-for="pod in podUrls" :key="pod" :value="pod">
                      {{ pod }}
                    </option>
                  </select>
                </label>
                <label class="block">
                  Privacy level
                  <select
                    v-model="privacy"
                    class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="shared">Shared</option>
                  </select>
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
                    :disabled="!selectedPod"
                    @click="refreshSolidLedgers"
                  >
                    Load pod ledgers
                  </button>
                </div>
                <label class="block">
                  Available ledgers
                  <select
                    v-model="selectedLedgerUrl"
                    class="mt-1 w-full border border-[var(--ui-border)] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select a ledger</option>
                    <option
                      v-for="entry in ledgerFiles"
                      :key="entry.url"
                      :value="entry.url"
                    >
                      {{ entry.name }}
                    </option>
                  </select>
                </label>
                <button
                  class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-sm"
                  :disabled="!selectedLedgerUrl"
                  @click="loadLedgerFromSolid"
                >
                  Import ledger
                </button>
              </div>

              <div v-if="solidStatus || solidError" class="space-y-1">
                <div v-if="solidStatus" class="text-emerald-700">
                  {{ solidStatus }}
                </div>
                <div v-if="solidError" class="text-red-600">
                  {{ solidError }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #console="{ container }">
        <WorkspaceConsole :container="container" />
      </template>
    </AppLayout>
  </TransitionGroup>
</template>
<style>
.slow-swap-enter-active,
.slow-swap-leave-active {
  transition: all 0.5s ease;
}
.slow-swap-enter-from,
.slow-swap-leave-to {
  opacity: 0;
}
/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.slow-swap-leave-active {
  position: absolute;
}
</style>
