<script setup>
import { shallowRef, computed, onMounted } from "vue";
import { STabs, SButton } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

import { useLedger } from "../../module/ledger/useLedger";
import Worker from "./worker?worker";
import { useSolid } from "@/module/solid/useSolid";
import { useLocalStorage } from "@vueuse/core";

new Worker();

const { ledger } = useLedger();
const { hasSolidSession } = useSolid();

// Revolutionary welcome state
const showOnboarding = shallowRef(false);
const hasSeenOnboarding = useLocalStorage("resistance-onboarding-seen", false);
const isFirstVisit = computed(
  () => !hasSeenOnboarding.value && (!ledger.value || ledger.value.length === 0)
);

const contentArea = shallowRef();

useBreadcrumbs({
  path: "/t/ledger",
  name: "System Administration",
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

const navTabs = computed(() => {
  // System administration tabs only (apps are now handled by /apps route)
  const systemTabs = [
    {
      title: "Users",
      path: `/t/ledger/users`,
    },
    {
      title: "Permissions",
      path: `/t/ledger/permissions`,
    },
    {
      title: "Audit",
      path: `/t/ledger/audit`,
    },
    {
      title: "Settings",
      path: `/t/ledger/settings`,
    },
    {
      title: "Demo",
      path: `/t/ledger/demo`,
    },
  ];

  return systemTabs;
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
          <span>⚙️</span>
          <span>System Administration</span>
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

        <!-- Connect to System Storage -->
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
        v-if="$route.path === '/t/ledger/demo'"
        class="flex flex-col w-full h-full p-4 gap-6"
      >
        <!-- todo -->
      </div>
      <div class="flex flex-1" v-else>
        <RouterView :key="$route.fullPath" />
      </div>
    </div>
    <!-- Bottom expandable panel -->
  </div>
</template>
