<script setup lang="ts">
import { shallowRef, watchEffect } from "vue";
import { useMouse, useThrottleFn } from "@vueuse/core";
import { provideAppShell } from "./useAppShell";

const {
  isBottomPanelExpanded,
  isLeftPanelExpanded,
  isRightPanelExpanded,
  bottomPanelHeight,
} = provideAppShell();

const { y } = useMouse();
const isDragging = shallowRef(false);

function handleDragStart() {
  isDragging.value = true;
}
function handleDragEnd() {
  isDragging.value = false;
}

const updateHeight = useThrottleFn((height) => {
  bottomPanelHeight.value = height;
});

watchEffect(() => {
  if (isDragging.value) {
    if (window.innerHeight - y.value > 220) {
      updateHeight(window.innerHeight - y.value);
    }
  }
});

window.addEventListener("mouseup", handleDragEnd);
</script>
<template>
  <div id="AppShell" class="flex h-sceen w-screen">
    <!-- Fixed responsive sidenav -->
    <section id="SideNav" class="flex">
      <nav class="w-16 bg-base-300 h-full z-40 shadow border-r border-zinc-600">
        <slot name="side-nav" />
      </nav>
    </section>

    <section id="MainContent" class="flex flex-col h-screen flex-1">
      <!-- Top fixed panel -->
      <section
        id="TopFixedPanel"
        v-if="$route.meta.hasTopPanel"
        class="h-14 items-center flex w-full z-50 bg-zinc-800 text-white"
      ></section>

      <!-- Main Content area -->
      <main
        class="flex-1 flex bg-zinc-900 text-white"
        :class="{ 'pointer-events-none': isDragging }"
      >
        <!-- Left Fixed Panel -->
        <div
          class="relative flex transition-all bg-zinc-900"
          :class="isLeftPanelExpanded ? 'w-64' : 'w-10'"
          v-if="$route.meta.hasLeftPanel"
        >
          <button
            aria-label="Toggle Left Panel"
            :aria-pressed="isLeftPanelExpanded"
            @click="isLeftPanelExpanded = !isLeftPanelExpanded"
            class="z-20 btn btn-circle btn-ghost btn-sm absolute right-1 top-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 transition-transform duration-300 transform-gpu"
              :class="isLeftPanelExpanded ? 'rotate-180' : 'rotate-0'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div
            id="LeftPanelContent"
            class="p-2 flex flex-1 flex-col overflow-x-hidden"
            v-show="isLeftPanelExpanded"
            :class="{ 'opacity-0': !isLeftPanelExpanded }"
          />
        </div>

        <div class="border-r border-l border-zinc-600 flex flex-1">
          <slot />
        </div>

        <div
          class="transition-all relative flex flex-col"
          :class="isRightPanelExpanded ? 'w-64' : 'w-10'"
          v-if="$route.meta.hasRightPanel"
        >
          <button
            aria-label="Toggle Right Panel"
            :aria-pressed="isRightPanelExpanded"
            @click="isRightPanelExpanded = !isRightPanelExpanded"
            class="absolute left-1 top-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 transition-transform duration-300 transform-gpu"
              :class="isRightPanelExpanded ? 'rotate-0' : 'rotate-180'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <div
            id="RightPanelContent"
            class="mt-8 flex h-full flex-col overflow-x-hidden px-2"
            v-show="isRightPanelExpanded"
            :class="{ 'opacity-0': !isRightPanelExpanded }"
          />
        </div>
      </main>

      <!-- Bottom expandable panel -->
      <section
        id="BottomPanel"
        class="flex flex-col transition-all z-50"
        :class="isBottomPanelExpanded ? `` : 'h-8'"
        :style="`height: ${
          isBottomPanelExpanded ? `${bottomPanelHeight}px` : '2rem'
        }`"
        v-if="$route.meta.hasBottomPanel"
      >
        <div
          @click="isBottomPanelExpanded = true"
          @mousedown="handleDragStart"
          class="w-full h-2 hover:h-2 hover:bg-blue-600 bg-blue-200 transition-colors"
        />
        <!-- Panel Control + Indicator -->
        <div class="flex justify-between py-1 px-2 h-8 bg-blue-400">
          <div class="flex-1" id="BottomPanelBanner" />

          <div class="flex items-center justify-center">
            <router-link to="/info" class="mr-2" alt="Info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </router-link>
            <button
              aria-label="Toggle Bottom Panel"
              :aria-pressed="isBottomPanelExpanded"
              @click="isBottomPanelExpanded = !isBottomPanelExpanded"
              class="mr-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 transition-transform duration-300 transform-gpu"
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
            </button>
          </div>
        </div>

        <div
          id="BottomPanelContent"
          class="flex-1 flex overflow-auto bg-zinc-900 text-white border-gray-600"
        />
      </section>
    </section>
  </div>
</template>
