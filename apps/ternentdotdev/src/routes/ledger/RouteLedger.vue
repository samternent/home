<script setup>
import { shallowRef, computed, watch } from "vue";

import { useElementBounding } from "@vueuse/core";
import { SResizablePanels, SIndicator, STabs } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

import { useLedger } from "../../module/ledger/useLedger";
import Worker from "./worker?worker";
import Console from "@/module/console/Console.vue";
import LedgerPendingRecords from "@/module/concords/LedgerPendingRecords.vue";
import LedgerCommitHistory from "@/module/concords/LedgerCommitHistory.vue";
import LedgerCommit from "@/module/concords/LedgerCommit.vue";
import { useSolid } from "@/module/solid/useSolid";
import { useLocalStorage } from "@vueuse/core";

new Worker();

const { ledger, compressedBlob } = useLedger();
const { hasSolidSession, webId } = useSolid();

const contentArea = shallowRef();
const contentWidth = shallowRef(600);

const { width: viewWidth } = useElementBounding(contentArea);

useBreadcrumbs({
  path: "/ledger",
  name: "Ledger",
});

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

const navTabs = computed(() => {
  return [
    {
      title: "Tasks",
      path: `/ledger/tasks`,
    },
    {
      title: "Notes",
      path: `/ledger/notes`,
    },
    {
      title: "Users",
      path: `/ledger/users`,
    },
    {
      title: "Permissions",
      path: `/ledger/permissions`,
    },
    {
      title: "Audit",
      path: `/ledger/audit`,
    },
    {
      title: "Settings",
      path: `/ledger/settings`,
    },
  ];
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

const sizeIndicator = computed(() => {
  const originalSize = formatBytes(JSON.stringify(ledger.value).length);
  const compressedSize = formatBytes(compressedBlob.value.size);

  return `${originalSize} / ${compressedSize} (gz)`;
});
</script>
<template>
  <div
    ref="contentArea"
    class="flex flex-col flex-1 relative max-w-full overflow-hidden"
  >
    <nav
      class="text-sm flex items-center justify-between border-b border-base-300 pt-2"
    >
      <STabs :items="navTabs" :path="$route.path" :exact="true" />

      <div v-if="hasSolidSession" class="flex items-center gap-2 px-4">
        <div class="badge badge-success badge-sm">
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
      <div v-else class="px-4">
        <router-link to="/solid" class="link text-xs text-base-content/60">
          Connect Solid Pod for sync
        </router-link>
      </div>
    </nav>

    <div class="flex-1 flex w-full overflow-hidden relative">
      <RouterView />
    </div>
    <!-- Bottom expandable panel -->
    <Console :container="contentArea">
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
            $route.path.includes('/audit') || $route.path.includes('/settings')
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
</template>
