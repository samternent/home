<script setup>
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, watch, shallowRef } from "vue";
import { useRoute } from "vue-router";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();
const mdAndLarger = breakpoints.greaterOrEqual("md");
const smallerThanMd = breakpoints.smaller("md");
const smallerThanLg = breakpoints.smaller("lg");

watch(route, () => {
  openSideBar.value = false;
});

const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);

const topItems = computed(() => [
  {
    name: "Todos",
    to: "/workspace/todo",
  },
  {
    name: "Users",
    to: "/workspace/users",
  },
  {
    name: "Permissions",
    to: "/workspace/permissions",
  },
  {
    name: "Tamper",
    to: "/workspace/tamper",
  },
]);

const bottomItems = computed(() => [
  {
    name: "Docs",
    to: "/docs",
  },
  {
    name: "Protocol Spec",
    to: "/protocol/spec",
  },
]);
const appVersion = shallowRef(
  document.querySelector("html").dataset.appVersion
);
</script>
<template>
  <div
    v-if="showSidebar"
    class="sticky top-0 flex flex-col border-r border-[var(--rule)]"
    :class="{
      'w-64': mdAndLarger,
      'w-64 absolute z-30 h-full': smallerThanMd && openSideBar,
    }"
  >
    <!-- Header -->
    <div v-if="smallerThanMd" class="p-4 border-b border-base-300/30">
      <div class="flex items-center justify-end">
        <!-- Mobile close button -->
        <button
          @click="openSideBar = false"
          class="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
        >
          <svg
            class="w-5 h-5"
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

    <!-- Navigation Items -->
    <div class="flex-1 flex flex-col justify-between p-4 overflow-hidden">
      <!-- Top Items -->
      <nav class="space-y-2">
        <div v-for="item in topItems" :key="item.to" class="group">
          <!-- Main Item -->
          <RouterLink
            :to="item.to"
            class="flex items-center px-4 py-1 border-[var(--rule)] transition-all duration-200 font-base"
            :class="{
              'font-medium': $route.path.startsWith(item.to),
              'font-base': !$route.path.startsWith(item.to),
            }"
            active-class="font-medium"
          >
            <div class="flex-1 min-w-0">
              {{ item.name }}
            </div>
          </RouterLink>
        </div>
      </nav>

      <!-- Bottom Items -->
      <nav class="space-y-2 pt-4">
        <div v-for="item in bottomItems" :key="item.to" class="group">
          <!-- Main Item -->
          <RouterLink
            :to="item.to"
            class="flex items-center gap-3 rounded-lg transition-all duration-200 hover:bg-base-300/50"
            :class="{
              'bg-base-300 font-bold': $route.path.startsWith(item.to),
              'text-base-content/80 hover:text-base-content':
                !$route.path.startsWith(item.to),
            }"
          >
            <div class="text-sm">{{ item.name }}</div>
          </RouterLink>
        </div>
        <a
          :href="`https://github.com/samternent/home/releases/tag/concord-${appVersion}`"
          target="_blank"
          class="text-xs font-mono"
        >
          v{{ appVersion }}
        </a>
      </nav>
    </div>
  </div>
</template>
