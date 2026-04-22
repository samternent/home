<script setup lang="ts">
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import {
  computed,
  watch,
  shallowRef,
  defineAsyncComponent,
  onMounted,
  ref,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppApi } from "@/app/api";
import { Button } from "ternent-ui/primitives";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();
const router = useRouter();
const appApi = useAppApi();

const mdAndLarger = breakpoints.greaterOrEqual("md");
const smallerThanMd = breakpoints.smaller("md");

watch(route, () => {
  openSideBar.value = false;
});

const openSideBar = useLocalStorage("ternentdotdev/openSideBar", true);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);

const topItems = computed(() => [
  {
    name: "Launch",
    to: "/launch",
  },
  {
    name: "Users",
    to: "/users",
  },
  {
    name: "Permissions",
    to: "/permissions",
  },
]);
const middleItems = computed(() => [
  // {
  //   name: "Tamper",
  //   to: "/workspace/tamper",
  // },
  // {
  //   name: "Solid Pods",
  //   to: "/workspace/solid",
  // },
]);

const bottomItems = computed(() => [
  // {
  //   name: "Docs",
  //   to: "/docs",
  // },
  // {
  //   name: "Protocol Spec",
  //   to: "/protocol/spec",
  // },
]);
const appVersion = shallowRef(
  typeof document !== "undefined"
    ? document.querySelector("html")?.dataset.appVersion
    : undefined,
);
const showThemeToggle = ref(false);

const AppThemeToggle = defineAsyncComponent(async () => {
  const module = await import("ternent-ui/components");
  return module.SThemeToggle;
});

onMounted(() => {
  showThemeToggle.value = true;
});

async function relaunchOnboarding(): Promise<void> {
  await appApi.identity.lock();
  await router.push("/");
}
</script>
<template>
  <div
    v-if="showSidebar"
    class="sticky top-0 flex flex-col border-r border-[var(--ui-border)] font-thin"
    :class="{
      'w-64': mdAndLarger,
      'w-64 absolute z-30 h-full': smallerThanMd && openSideBar,
    }"
  >
    <!-- Header -->
    <div
      v-if="smallerThanMd"
      class="p-2 border-b border-[var(--ui-border)] z-40 left-0 w-full flex items-center justify-between"
    >
      <div class="flex items-center justify-end">
        <!-- Mobile close button -->
        <button
          @click="openSideBar = false"
          class="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
    Concord. OS
    <!-- Navigation Items -->
    <div class="flex-1 flex flex-col justify-between p-2 overflow-hidden">
      <!-- Top Items -->
      <nav class="space-y-1">
        <div v-for="item in topItems" :key="item.to" class="group">
          <!-- Main Item -->
          <RouterLink
            :to="item.to"
            class="flex items-center px-4 py-1 border-[var(--ui-border)] transition-all duration-200"
            :class="{
              'font-medium text-[var(--ui-primary)]': $route.path.startsWith(
                item.to,
              ),
            }"
          >
            <div class="flex-1 min-w-0">{{ item.name }}</div>
          </RouterLink>
        </div>
        <hr class="m-4 border-t border-[var(--ui-border)]" />
        <div v-for="item in middleItems" :key="item.to" class="group">
          <!-- Main Item -->
          <RouterLink
            :to="item.to"
            class="flex items-center px-4 py-1 border-[var(--ui-border)] transition-all duration-200"
            :class="{
              'font-medium text-[var(--ui-primary)]': $route.path.startsWith(
                item.to,
              ),
            }"
          >
            <div class="flex-1 min-w-0">{{ item.name }}</div>
          </RouterLink>
        </div>
      </nav>

      <!-- Bottom Items -->
      <nav class="space-y-2 pt-4">
        <div class="py-2 flex flex-col w-auto gap-2"></div>
        <div class="flex flex-col w-auto gap-1 font-sans">
          <RouterLink
            v-for="item in bottomItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg transition-all duration-200 hover:bg-base-300/50 text-xs px-4 hover:text-[var(--ui-secondary)]"
          >
            {{ item.name }}
          </RouterLink>
          <a
            :href="`https://github.com/samternent/home/releases/tag/concord-demo-${appVersion}`"
            target="_blank"
            class="text-xs font-mono px-2 hover:text-[var(--ui-accent)] transition-colors px-4 py-2"
          >
            v{{ appVersion }}
          </a>
          <div class="flex items-center gap-2">
            <Button
              class="flex-1"
              variant="secondary"
              @click="relaunchOnboarding"
            >
              Lock
            </Button>
            <AppThemeToggle v-if="showThemeToggle" size="sm" />
          </div>
        </div>
      </nav>
    </div>
  </div>

  <!-- Collapse Button (Desktop) -->
  <div v-if="smallerThanMd && !openSideBar" class="fixed top-0 left-0 z-40">
    <Button @click="openSideBar = !openSideBar" variant="ghost" size="sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </Button>
  </div>
</template>
