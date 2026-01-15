<script setup lang="ts">
import { onMounted, computed, shallowRef } from "vue";
import { LedgerContainer } from "ternent-ledger-types";

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

const useSampleLedger = true;
const CORE_LEDGER_KEY = "concord:ledger:core";
const TAMPER_ACTIVE_KEY = "concord:ledger:tampered";

onMounted(async () => {
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
    if (!bridge.flags.value.hasLedger && useSampleLedger) {
      await api.load(sampleLedger as LedgerContainer, [], true);
    }
  }
  await api.auth(priv.value!, pub.value!);
});

const hasLedger = computed(() => bridge.flags.value.hasLedger);
</script>
<template>
  <AppLayout>
    <template #left-side> <SideNav /> </template>

    <div class="p-4 flex flex-1 h-full">
      <RouterView v-if="hasLedger" />
      <div v-else>
        <p>No ledger found in this workspace.</p>
        <button @click="api.create()">Create Ledger</button>
      </div>
    </div>
    <template #console="{ container }">
      <WorkspaceConsole :container="container" />
    </template>
  </AppLayout>
</template>
