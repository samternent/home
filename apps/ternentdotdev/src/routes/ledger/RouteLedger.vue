<script setup>
import { shallowRef, onMounted, onBeforeUnmount, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { STabs, SButton, SIndicator } from "ternent-ui/components";
import { DateTime } from "luxon";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useAppShell } from "../../module/app-shell/useAppShell";
import ConcordsLog from "../../module/concords/ConcordsLog.vue";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import { useLedger } from "../../module/ledger/useLedger";
import Worker from './worker?worker'

new Worker();

const { isBottomPanelExpanded, bottomPanelHeight } = useAppShell();

const isDragging = shallowRef(false);
const { ledger, getCollections } = useLedger();

const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);

function handleDragStart() {
  isDragging.value = true;
  document.body.style.overflowY = "hidden";
}
function handleDragEnd() {
  isDragging.value = false;
  document.body.style.overflowY = "";
}

function handleMouseMove(e) {
  if (isDragging.value && window.innerHeight - e.pageY > 100 && e.pageY > 54) {
    bottomPanelHeight.value = window.innerHeight - e.pageY;
  }
}
function handleTouchMove(e) {
  if (
    isDragging.value &&
    window.innerHeight - e.changedTouches[0].pageY > 100 &&
    e.changedTouches[0].pageY > 54
  ) {
    bottomPanelHeight.value = window.innerHeight - e.changedTouches[0].pageY;
  }
}
onMounted(() => {
  window.addEventListener("mouseup", handleDragEnd);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("touchend", handleDragEnd);
  window.addEventListener("touchmove", handleTouchMove);
});
onBeforeUnmount(() => {
  window.removeEventListener("mouseup", handleDragEnd);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("touchend", handleDragEnd);
  window.removeEventListener("touchmove", handleTouchMove);
});

useBreadcrumbs({
  path: "/l",
  name: "Ledger",
});
const tabs = computed(() => {
  const collections = getCollections();
  const sheets = new Set(
    Object.keys(collections).map((collection) =>
      collection.split(":")[0].toLowerCase()
    )
  );
  return [
    ...[...sheets].map((sheet) => ({
      title: sheet,
      path: `/l/${sheet}`,
    })),
    {
      title: "+",
      path: "/l/add",
    },
  ];
});

function formatTime(time) {
  const date = DateTime.fromMillis(time);
  return date.toRelative(DateTime.DATETIME_MED);
}
</script>
<template>
  <div class="md:px-[1em]">
    <div class="my-4 flex justify-between">
      <div class="text-lg">
        <span>{{ ledger.id.slice(0, 6) }}.concord</span>
      </div>
      <div class="mr-2 flex text-xs items-end">
        Created
        {{ formatTime(ledger.chain[0].timestamp) }} by
        <IdentityAvatar
          size="xs"
          class="ml-2"
          :identity="ledger.chain[0].records[0].identity"
        />
      </div>
    </div>
    <STabs :items="tabs" type="lifted" :path="$route.path" />
  </div>
  <div class="flex flex-col flex-1 overflow-auto relative">
    <div class="flex-1 overflow-auto w-full">
      <div class="flex flex-col h-full flex-1">
        <div class="flex mx-[1em] bg-base-200 border-x border-base-300">
          <!-- <SNavTabs
        title="Document name"
        :items="tabs"
        :path="$route.path"
        :exact="true"
      /> -->
        </div>
        <div class="flex flex-1 relative">
          <div
            class="absolute md:left-[1em] left-0 right-0 md:right-[1em] top-0 bottom-0 overflow-auto bg-base-200 border-x border-base-300"
          >
            <RouterView />
          </div>
        </div>
      </div>
    </div>
    <!-- Bottom expandable panel -->
    <section
      class="flex flex-col z-20"
      :class="{
        'h-16': !isBottomPanelExpanded,
        'transition-all': !isDragging,
      }"
      :style="`height: ${
        isBottomPanelExpanded ? `${bottomPanelHeight}px` : '2.1rem'
      }`"
    >
      <div
        @click="isBottomPanelExpanded = true"
        @mousedown="handleDragStart"
        @touchstart="handleDragStart"
        :class="{
          'hover:opacity-100 cursor-row-resize': isBottomPanelExpanded,
          'h-0.5': !isBottomPanelExpanded,
          '!bg-secondary': isDragging,
        }"
        class="w-full h-1 transition-all bg-primary opacity-50"
      />
      <!-- Panel Control + Indicator -->
      <div
        class="flex justify-between py-1 px-2 h-8 border-b border-base-300 bg-base-200"
      >
        <div class="flex-1 items-center flex">
          <SIndicator>7</SIndicator>
        </div>

        <div class="flex items-center justify-center">
          <SButton
            aria-label="Toggle Bottom Panel"
            :aria-pressed="isBottomPanelExpanded"
            @click="isBottomPanelExpanded = !isBottomPanelExpanded"
            type="ghost"
            class="mr-2 btn-xs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 transition-transform duration-300 transform-gpu"
              :class="isBottomPanelExpanded ? 'rotate-0' : 'rotate-180'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </SButton>
        </div>
      </div>

      <div class="flex-1 flex overflow-auto bg-base-100 font-thin text-sm">
        <ConcordsLog />
      </div>
    </section>
  </div>
</template>
