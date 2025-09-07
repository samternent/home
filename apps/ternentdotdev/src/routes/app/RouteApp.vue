<script setup>
import { shallowRef, computed, watch } from "vue";
import { useElementBounding, useLocalStorage } from "@vueuse/core";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { provideAppBuilder } from "@/module/builder/useAppBuilder";
import { provideLedgerApps } from "@/module/ledger/useLedgerApps";

import { SResizablePanels, SIndicator } from "ternent-ui/components";
import { useLedger } from "@/module/ledger/useLedger";

import Console from "@/module/console/Console.vue";
import LedgerPendingRecords from "@/module/concords/LedgerPendingRecords.vue";
import LedgerCommitHistory from "@/module/concords/LedgerCommitHistory.vue";
import LedgerCommit from "@/module/concords/LedgerCommit.vue";

// Provide app builder for all child routes
const appBuilder = provideAppBuilder();
provideLedgerApps(appBuilder); // Pass the app builder instance

const { ledger, compressedBlob } = useLedger();

// Provide root breadcrumb for all routes
useBreadcrumbs({ name: "Home", path: "/" });

const contentArea = shallowRef();
const contentWidth = shallowRef(600);
const { width: viewWidth } = useElementBounding(contentArea);

const pendingRecords = computed(() => ledger.value?.pending_records.length);

const tabs = computed(() => [
  {
    title: "Pending",
    tab: "pending",
  },
  {
    title: "History",
    tab: "history",
  },
]);
const subTabs = computed(() => [
  {
    title: "Commit",
    tab: "commit",
  },
]);

const activeTab = useLocalStorage(
  "ternentdotdev/RouteLedger/consoleTab",
  "pending"
);
const activeSubTab = useLocalStorage(
  "ternentdotdev/RouteLedger/consoleSubTab",
  "commit"
);
const activeLastTab = useLocalStorage(
  "ternentdotdev/RouteLedger/consoleLastTab",
  "pending"
);

watch(activeTab, () => {
  activeLastTab.value = activeTab.value;
});
watch(activeSubTab, () => {
  activeLastTab.value = activeSubTab.value;
});

const sizeIndicator = computed(() => {
  const originalSize = formatBytes(JSON.stringify(ledger.value).length);
  const compressedSize = formatBytes(compressedBlob.value.size);

  return `${originalSize} / ${compressedSize} (gz)`;
});

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
</script>
<template>
  <div ref="contentArea" class="flex-1 flex w-full overflow-hidden relative">
    <div class="flex flex-1 flex-col">
      <RouterView />
      <Console :container="container">
        <template #panel-control>
          <SIndicator>{{ pendingRecords }}</SIndicator>
          <SIndicator type="ghost">{{ sizeIndicator }}</SIndicator>
        </template>
        <SResizablePanels
          v-if="viewWidth > 1400"
          v-model:contentWidth="contentWidth"
          :minContentWidth="750"
          :minSidebarWidth="600"
          identifier="RouteLedgerConsole"
          type="primary"
        >
          <div class="flex flex-col flex-1 bg-base-200 overflow-hidden">
            <div role="tablist" class="tabs tabs-lifted mt-2 ml-4 mr-8">
              <a
                v-for="tab in tabs"
                :key="tab.tab"
                @click="activeTab = tab.tab"
                role="tab"
                class="tab"
                :class="{ 'tab-active': activeTab === tab.tab }"
                >{{ tab.title }}</a
              >
            </div>

            <LedgerPendingRecords v-if="activeTab === 'pending'" />
            <LedgerCommitHistory v-if="activeTab === 'history'" />
          </div>
          <template #sidebar>
            <div class="flex flex-col flex-1 bg-base-200 overflow-hidden">
              <div role="tablist" class="tabs tabs-lifted mt-2 ml-4 mr-8">
                <a
                  v-for="tab in subTabs"
                  :key="tab.tab"
                  @click="activeSubTab = tab.tab"
                  role="tab"
                  class="tab"
                  :class="{ 'tab-active': activeSubTab === tab.tab }"
                  >{{ tab.title }}</a
                >
              </div>
              <LedgerCommit v-if="activeSubTab === 'commit'" />
            </div>
          </template>
        </SResizablePanels>
        <div v-else class="flex flex-col flex-1 bg-base-200 overflow-hidden">
          <!-- Show content for routes that don't need console -->
          <div
            v-if="
              $route.path.includes('/audit') ||
              $route.path.includes('/settings')
            "
            class="flex-1 flex items-center justify-center text-base-content/50"
          >
            <div class="text-center">
              <div class="text-4xl mb-4">🔧</div>
              <div class="text-lg">Console not needed</div>
              <div class="text-sm">This page has its own interface</div>
            </div>
          </div>

          <!-- Console for data management pages -->
          <div v-else>
            <div role="tablist" class="tabs tabs-lifted mt-2 ml-4 mr-8">
              <a
                v-for="tab in [...tabs, ...subTabs]"
                :key="tab.tab"
                @click="activeLastTab = tab.tab"
                role="tab"
                class="tab"
                :class="{ 'tab-active': activeLastTab === tab.tab }"
                >{{ tab.title }}</a
              >
            </div>

            <LedgerPendingRecords v-if="activeLastTab === 'pending'" />
            <LedgerCommitHistory v-if="activeLastTab === 'history'" />
            <LedgerCommit v-if="activeLastTab === 'commit'" />
          </div>
        </div>
      </Console>
    </div>
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
