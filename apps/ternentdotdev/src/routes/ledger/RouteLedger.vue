<script setup>
import { shallowRef, computed, watch, onMounted } from "vue";

import { useElementBounding } from "@vueuse/core";
import {
  SResizablePanels,
  SIndicator,
  STabs,
  SButton,
} from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

import { useLedger } from "../../module/ledger/useLedger";
import Worker from "./worker?worker";
import Console from "@/module/console/Console.vue";
import LedgerPendingRecords from "@/module/concords/LedgerPendingRecords.vue";
import LedgerCommitHistory from "@/module/concords/LedgerCommitHistory.vue";
import LedgerCommit from "@/module/concords/LedgerCommit.vue";
import { useSolid } from "@/module/solid/useSolid";
import { useLocalStorage } from "@vueuse/core";
import ResistanceOnboarding from "@/module/onboarding/ResistanceOnboarding.vue";
import SecurityProof from "@/module/demo/SecurityProof.vue";

new Worker();

const { ledger, compressedBlob } = useLedger();
const { hasSolidSession, webId } = useSolid();

// Revolutionary welcome state
const showOnboarding = shallowRef(false);
const hasSeenOnboarding = useLocalStorage("resistance-onboarding-seen", false);
const isFirstVisit = computed(
  () => !hasSeenOnboarding.value && (!ledger.value || ledger.value.length === 0)
);

const contentArea = shallowRef();
const contentWidth = shallowRef(600);

const { width: viewWidth } = useElementBounding(contentArea);

useBreadcrumbs({
  path: "/ledger",
  name: "Resistance Room",
});

// Show onboarding for new users
onMounted(() => {
  if (isFirstVisit.value) {
    setTimeout(() => {
      showOnboarding.value = true;
    }, 1000);
  }
});

function handleOnboardingComplete() {
  hasSeenOnboarding.value = true;
  showOnboarding.value = false;
}

function startRevolution() {
  showOnboarding.value = true;
}

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
  {
    title: "Demo",
    tab: "demo",
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
      title: "Board",
      path: `/ledger/board`,
    },
    {
      title: "Task List",
      path: `/ledger/task-list`,
    },
    {
      title: "Task Table",
      path: `/ledger/task-table`,
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
    {
      title: "Demo",
      path: `/ledger/demo`,
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
      class="text-body-sm flex items-center justify-between pt-micro px-micro"
    >
      <div class="flex items-center gap-micro">
        <!-- Revolutionary Badge -->
        <div
          v-if="isFirstVisit"
          class="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-medium"
        >
          <span>🔥</span>
          <span>Ready for Resistance</span>
        </div>

        <STabs
          :items="navTabs"
          :path="$route.path"
          :exact="true"
          size="micro"
          type="stripe"
        />
      </div>

      <div class="flex items-center gap-micro">
        <!-- Solid Pod Status -->
        <div v-if="hasSolidSession" class="flex items-center gap-micro">
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
            Solid Connected
          </div>
        </div>

        <!-- Connect to Resistance Network -->
        <div v-else class="flex items-center">
          <SButton
            size="nano"
            variant="outline"
            @click="$router.push('/solid')"
            class="rounded-sm border-base-300/50 hover:border-base-400 hover:bg-base-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-2.5 h-2.5 mr-1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
              />
            </svg>
            Connect to solid
          </SButton>
        </div>
      </div>
    </nav>

    <div class="flex-1 flex w-full overflow-hidden relative">
      <div
        v-if="$route.path === '/ledger/demo'"
        class="flex flex-col w-full h-full p-4 gap-6"
      >
        <ResistanceOnboarding />
        <SecurityProof />
      </div>
      <div class="flex flex-1" v-else>
        <RouterView />
      </div>
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
          <div
            v-if="activeLastTab === 'demo'"
            class="flex flex-col w-full h-full p-4 gap-6"
          >
            <ResistanceOnboarding />
            <SecurityProof />
          </div>
        </div>
      </div>
    </Console>

    <!-- Onboarding Component -->
    <ResistanceOnboarding
      :open="showOnboarding"
      @update:open="showOnboarding = $event"
      @completed="handleOnboardingComplete"
    />
  </div>
</template>
