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
import LedgerEncrypt from "@/module/concords/LedgerEncrypt.vue";
import LedgerStorage from "@/module/concords/LedgerStorage.vue";
import { useLocalStorage } from "@vueuse/core";

new Worker();

const { ledger, compressedBlob } = useLedger();

const contentArea = shallowRef();
const contentWidth = shallowRef(600);

const { width: viewWidth } = useElementBounding(contentArea);

useBreadcrumbs({
  path: "/ledger",
  name: "Ledger",
});

const pendingRecords = computed(() => ledger.value.pending_records.length);

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
  {
    title: "Storage",
    tab: "storage",
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
      title: "Permissions",
      path: `/ledger/permissions`,
    },
    {
      title: "Users",
      path: `/ledger/users`,
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
    <nav class="py-2 text-sm">
      <STabs :items="navTabs" :path="$route.path" :exact="true" />
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
        v-if="viewWidth > 1250"
        v-model:contentWidth="contentWidth"
        :minContentWidth="750"
        :minSidebarWidth="450"
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
            <LedgerEncrypt v-if="activeSubTab === 'encrypt'" />
            <LedgerStorage v-if="activeSubTab === 'storage'" />
          </div>
        </template>
      </SResizablePanels>
      <div v-else class="flex flex-col flex-1 bg-base-200 overflow-hidden">
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
        <LedgerEncrypt v-if="activeLastTab === 'encrypt'" />
        <LedgerStorage v-if="activeLastTab === 'storage'" />
      </div>
    </Console>
  </div>
</template>
