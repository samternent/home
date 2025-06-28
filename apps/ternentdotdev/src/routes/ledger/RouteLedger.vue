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
import LedgerImport from "@/module/concords/LedgerImport.vue";
import LedgerExport from "@/module/concords/LedgerExport.vue";
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
  {
    title: "Import",
    tab: "import",
  },
  {
    title: "Export",
    tab: "export",
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
    <nav
      class="text-sm flex items-center justify-between border-b border-base-300 pt-2"
    >
      <STabs :items="navTabs" :path="$route.path" :exact="true" />
    </nav>
    <section class="text-sm flex items-center justify-between p-2">
      <div></div>
      <label class="input input-bordered input-sm flex items-center gap-2">
        <input type="text" class="grow" placeholder="Search" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          class="h-4 w-4 opacity-70"
        >
          <path
            fill-rule="evenodd"
            d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
            clip-rule="evenodd"
          />
        </svg>
      </label>
    </section>

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
            <LedgerEncrypt v-if="activeSubTab === 'encrypt'" />
            <LedgerImport v-if="activeSubTab === 'import'" />
            <LedgerExport v-if="activeSubTab === 'export'" />
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
        <LedgerImport v-if="activeLastTab === 'import'" />
        <LedgerExport v-if="activeLastTab === 'export'" />
      </div>
    </Console>
  </div>
</template>
