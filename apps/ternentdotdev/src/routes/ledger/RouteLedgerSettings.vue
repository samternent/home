<script setup>
import { shallowRef, ref, watch } from "vue";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { STabs } from "ternent-ui/components";
// import LedgerImport from "@/module/concords/LedgerImport.vue";
// import LedgerExport from "@/module/concords/LedgerExport.vue";
import { useSolid } from "@/module/solid/useSolid";
import { useLocalStorage } from "@vueuse/core";

const { hasSolidSession, webId, logout } = useSolid();

useBreadcrumbs({
  path: "/ledger/settings",
  name: "Settings",
});

const activeTab = useLocalStorage(
  "ternentdotdev/LedgerSettings/activeTab",
  "import"
);

const settingsTabs = [
  {
    title: "Import",
    path: "import",
  },
  {
    title: "Export",
    path: "export",
  },
  {
    title: "Sync",
    path: "sync",
  },
];

// Simple tab switching for now
const currentTab = shallowRef(activeTab.value);
const importRefreshTrigger = ref(0);

function switchTab(tabPath) {
  currentTab.value = tabPath;
  activeTab.value = tabPath;
}

// Function to trigger import refresh when export succeeds
function triggerImportRefresh() {
  importRefreshTrigger.value++;
}
</script>

<template>
  <div class="flex flex-col flex-1 max-w-full overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-base-200 bg-base-100">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-3">
            <span class="text-3xl">⚙️</span>
            Ledger Settings
          </h1>
          <p class="text-base-content/60 mt-1">
            Manage imports, exports, and synchronization
          </p>
        </div>
        <div v-if="hasSolidSession" class="badge badge-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-3 mr-1"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          Solid Pod Connected
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex gap-1 bg-base-200 p-1 rounded-lg w-fit">
        <button
          v-for="tab in settingsTabs"
          :key="tab.path"
          @click="switchTab(tab.path)"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          :class="
            currentTab === tab.path
              ? 'bg-base-100 text-base-content shadow-sm'
              : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
          "
        >
          {{ tab.title }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-auto">
      <!-- <LedgerImport
        v-if="currentTab === 'import'"
        :refresh-trigger="importRefreshTrigger"
      />
      <LedgerExport
        v-if="currentTab === 'export'"
        @ledger-exported="triggerImportRefresh"
      /> -->

      <!-- Sync Tab -->
      <div
        v-if="currentTab === 'sync'"
        class="flex flex-col h-full bg-base-100"
      >
        <div class="px-6 py-8 text-center">
          <div v-if="hasSolidSession" class="max-w-md mx-auto">
            <div class="text-6xl mb-6">🌐</div>
            <h3 class="text-xl font-semibold mb-4">Solid Pod Connected</h3>
            <div class="bg-base-200 p-4 rounded-lg mb-6 text-left">
              <div class="text-sm text-base-content/70 mb-2">Connected to:</div>
              <div class="font-mono text-xs break-all">{{ webId }}</div>
            </div>
            <div class="space-y-3">
              <div class="text-sm text-base-content/60">
                Your ledger can now sync with your Solid pod. Use the Import and
                Export tabs to manage synchronization.
              </div>
              <button @click="logout" class="btn btn-outline btn-sm">
                Disconnect Pod
              </button>
            </div>
          </div>

          <div v-else class="max-w-md mx-auto">
            <div class="text-6xl mb-6">🔗</div>
            <h3 class="text-xl font-semibold mb-4">Connect Your Solid Pod</h3>
            <div class="text-sm text-base-content/60 mb-6">
              Connect to your personal Solid pod to enable secure, decentralized
              synchronization of your ledger data.
            </div>
            <router-link to="/solid" class="btn btn-primary">
              Connect Solid Pod
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
