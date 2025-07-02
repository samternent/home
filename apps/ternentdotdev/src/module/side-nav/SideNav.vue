<script setup>
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useWhiteLabel } from "../brand/useWhiteLabel";
import Logo from "../brand/Logo.vue";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();
const mdAndLarger = breakpoints.greaterOrEqual("md");
const smallerThanMd = breakpoints.smaller("md");
const smallerThanLg = breakpoints.smaller("lg");

const collapsedSideBar = useLocalStorage("app/collapsedSideBar", true);
const whiteLabel = useWhiteLabel();

watch(route, () => {
  openSideBar.value = false;
});
watch(smallerThanLg, (val) => {
  if (val) {
    collapsedSideBar.value = true;
  }
});

const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);

watch([smallerThanMd, openSideBar], () => {
  if (smallerThanMd.value && openSideBar.value) {
    collapsedSideBar.value = false;
  } else if (smallerThanMd.value && !openSideBar.value) {
    collapsedSideBar.value = true;
  }
});

const topItems = computed(() => [
  {
    name: "Tools",
    to: "/tools",
    icon: "🛠️",
    d: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z",
    description: "Compression & encryption tools"
  },

  {
    name: "Ledger",
    to: "/ledger",
    icon: "📊",
    d: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
    description: "Decentralized ledger system"
  },
]);

const bottomItems = computed(() => [
  {
    name: "Settings",
    to: "/settings",
    icon: "⚙️",
    d: "M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    description: "App preferences & themes"
  },
  {
    name: "Docs",
    to: "/readme",
    icon: "📚",
    d: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25",
    description: "Package documentation"
  },
]);
</script>
<template>
  <div
    v-if="showSidebar"
    class="flex flex-col bg-base-200/80 backdrop-blur-sm border-r border-base-300/50 shadow-lg relative transition-all duration-300 ease-in-out"
    :class="{
      'w-20': collapsedSideBar,
      'w-64': mdAndLarger && !collapsedSideBar,
      'w-64 absolute z-30 h-full': smallerThanMd && openSideBar,
    }"
  >
    <!-- Clean Header -->
    <div class="p-3 border-b border-base-300/20">
      <RouterLink to="/" class="flex items-center gap-2 group">
        <Logo class="h-6 w-6 transition-transform duration-200 group-hover:rotate-12" />
        <div v-show="!collapsedSideBar" class="transition-all duration-300 overflow-hidden">
          <span class="text-sm font-medium text-base-content/70 group-hover:text-primary transition-colors duration-200">
            ternent.dev
          </span>
        </div>
      </RouterLink>
    </div>

    <!-- Header -->
    <div v-if="smallerThanMd" class="p-4 border-b border-base-300/30">
      <div class="flex items-center justify-end">
        <!-- Mobile close button -->
        <button
          @click="openSideBar = false"
          class="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-base-300/50"
            :class="{
              'bg-primary/10 text-primary border border-primary/20': $route.path.startsWith(item.to),
              'text-base-content/80 hover:text-base-content': !$route.path.startsWith(item.to),
              'justify-center': collapsedSideBar
            }"
            active-class="bg-primary/10 text-primary border border-primary/20"
          >
            <span class="text-xl flex-shrink-0">{{ item.icon }}</span>
            
            <div v-if="!collapsedSideBar" class="flex-1 min-w-0">
              <div class="font-medium text-sm">{{ item.name }}</div>
              <div v-if="item.description" class="text-xs text-base-content/60 truncate">
                {{ item.description }}
              </div>
            </div>
          </RouterLink>
        </div>
      </nav>

      <!-- Bottom Items -->
      <nav class="space-y-2 border-t border-base-300/30 pt-4">
        <div v-for="item in bottomItems" :key="item.to" class="group">
          <!-- Main Item -->
          <RouterLink
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-base-300/50"
            :class="{
              'bg-primary/10 text-primary border border-primary/20': $route.path.startsWith(item.to),
              'text-base-content/80 hover:text-base-content': !$route.path.startsWith(item.to),
              'justify-center': collapsedSideBar
            }"
          >
            <span class="text-xl flex-shrink-0">{{ item.icon }}</span>
            
            <div v-if="!collapsedSideBar" class="flex-1 min-w-0">
              <div class="font-medium text-sm">{{ item.name }}</div>
              <div v-if="item.description" class="text-xs text-base-content/60 truncate">
                {{ item.description }}
              </div>
            </div>
          </RouterLink>
        </div>
      </nav>
    </div>

    <!-- Collapse Button (Desktop) -->
    <div class="p-4 border-t border-base-300/30">
      <button
        v-if="mdAndLarger"
        @click="collapsedSideBar = !collapsedSideBar"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-base-300/50 hover:bg-base-300 transition-all duration-200"
        :class="{ 'px-2': collapsedSideBar }"
      >
        <svg 
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180': collapsedSideBar }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span v-if="!collapsedSideBar" class="text-sm font-medium">Collapse</span>
      </button>
    </div>
  </div>
</template>
