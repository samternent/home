<script setup lang="ts">
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppApi } from "@/app/api";
import { Button } from "ternent-ui/primitives";
import { SidebarNav } from "ternent-ui/patterns";
import type { SidebarNavSection } from "ternent-ui/patterns";
import ThemeModeToggle from "./ThemeModeToggle.vue";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();
const router = useRouter();
const appApi = useAppApi();

const mdAndLarger = breakpoints.greaterOrEqual("md");
const smallerThanMd = breakpoints.smaller("md");

const openSideBar = useLocalStorage("ternentdotdev/openSideBar", true);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);

watch(route, () => {
  openSideBar.value = false;
});

const appVersion = shallowRef(
  typeof document !== "undefined"
    ? document.querySelector("html")?.dataset.appVersion
    : undefined,
);

const topItems = computed(() => [
  {
    id: "launch",
    label: "Launch",
    to: "/launch",
    active: route.path.startsWith("/launch"),
  },
  {
    id: "users",
    label: "Users",
    to: "/users",
    active: route.path.startsWith("/users"),
  },
  {
    id: "permissions",
    label: "Permissions",
    to: "/permissions",
    active: route.path.startsWith("/permissions"),
  },
]);

const middleItems = computed(() => []);
const bottomItems = computed(() => []);

const navigationSections = computed<SidebarNavSection[]>(() =>
  [
    { id: "primary", items: topItems.value },
    { id: "secondary", items: middleItems.value },
    { id: "tertiary", items: bottomItems.value },
  ].filter((section) => section.items.length > 0),
);

const releaseHref = computed(() =>
  appVersion.value
    ? `https://github.com/samternent/home/releases/tag/concord-demo-${appVersion.value}`
    : "https://github.com/samternent/home/releases",
);

function handleNavSelect(): void {
  if (smallerThanMd.value) {
    openSideBar.value = false;
  }
}

async function relaunchOnboarding(): Promise<void> {
  await appApi.identity.lock();
  await router.push("/");
}
</script>
<template>
  <div
    v-if="showSidebar"
    class="sticky top-0"
    :class="{
      'w-64': mdAndLarger,
      'absolute z-30 h-full w-64': smallerThanMd && openSideBar,
    }"
  >
    <SidebarNav
      title="Concord. OS"
      :sections="navigationSections"
      @select="handleNavSelect"
    >
      <template #header>
        <div class="flex w-full items-center justify-between gap-2">
          <p class="m-0 text-sm font-medium tracking-[0.08em] text-[var(--ui-fg)]">
            Concord. OS
          </p>
          <Button
            v-if="smallerThanMd"
            variant="plain-secondary"
            size="xs"
            aria-label="Close navigation"
            @click="openSideBar = false"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col gap-2">
          <Button
            as="a"
            :href="releaseHref"
            target="_blank"
            rel="noreferrer noopener"
            variant="plain-secondary"
            size="xs"
            class="w-full justify-start font-mono"
          >
            v{{ appVersion ?? "dev" }}
          </Button>

          <div class="flex items-center gap-2">
            <Button
              class="flex-1"
              variant="secondary"
              size="sm"
              @click="relaunchOnboarding"
            >
              Lock
            </Button>
            <ThemeModeToggle />
          </div>
        </div>
      </template>
    </SidebarNav>
  </div>

  <div v-if="smallerThanMd && !openSideBar" class="fixed left-0 top-0 z-40">
    <Button
      variant="plain-secondary"
      size="sm"
      aria-label="Open navigation"
      @click="openSideBar = !openSideBar"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-6"
        aria-hidden="true"
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
