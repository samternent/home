<script setup>
import { shallowRef, computed } from "vue";
import { SResizablePanels, SIndicator, STabs } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

import { useLedger } from "../../module/ledger/useLedger";
import Worker from "./worker?worker";
import Console from "@/module/console/Console.vue";
import LedgerPendingRecords from "@/module/concords/LedgerPendingRecords.vue";
import LedgerCommitHistory from "@/module/concords/LedgerCommitHistory.vue";
import { useLocalStorage } from "@vueuse/core";

new Worker();

const { ledger, getCollections } = useLedger();

const contentArea = shallowRef();
const contentWidth = shallowRef(600);

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

const activeTab = useLocalStorage(
  "ternentdotdev/RouteLedger/consoleTab",
  "logs"
);
</script>
<template>
  <div
    ref="contentArea"
    class="flex flex-col flex-1 relative max-w-full overflow-hidden"
  >
    <div class="flex-1 flex w-full overflow-hidden">
      <RouterView />
    </div>
    <!-- Bottom expandable panel -->
    <Console :container="contentArea">
      <template #panel-control>
        <SIndicator>{{ pendingRecords }}</SIndicator>
        <span class="text-xs ml-2">pending records</span>
      </template>
      <SResizablePanels
        v-model:contentWidth="contentWidth"
        :minContentWidth="550"
        :minSidebarWidth="550"
        identifier="RouteLedgerConsole"
        type="secondary"
      >
        <div class="flex flex-col flex-1 bg-base-200 overflow-hidden">
          <div role="tablist" class="tabs tabs-lifted mt-2 mx-4">
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
          <TransitionGroup>
            <LedgerPendingRecords v-if="activeTab === 'pending'" />
            <LedgerCommitHistory v-if="activeTab === 'history'" />
          </TransitionGroup>
        </div>

        <template #sidebar> </template>
      </SResizablePanels>
    </Console>
  </div>
</template>
