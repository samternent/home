<script setup lang="ts">
import { shallowRef, onMounted, onBeforeUnmount } from "vue";
import { provideAppShell } from "./useAppShell";

const {
  isBottomPanelExpanded,
  isLeftPanelExpanded,
  isRightPanelExpanded,
  bottomPanelHeight,
} = provideAppShell();

const isDragging = shallowRef(false);

function handleDragStart() {
  isDragging.value = true;
  document.body.style.overflowY = "hidden";
}
function handleDragEnd() {
  isDragging.value = false;
  document.body.style.overflowY = "";
}

function handleMouseMove(e: MouseEvent) {
  if (isDragging.value && window.innerHeight - e.pageY > 100 && e.pageY > 54) {
    bottomPanelHeight.value = window.innerHeight - e.pageY;
  }
}
function handleTouchMove(e: TouchEvent) {
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
</script>
<template>
  <div
    id="AppShell"
    class="flex h-sceen w-screen"
    :class="{ 'pointer-events-none': isDragging }"
  >
    <!-- Fixed responsive sidenav -->
    <!-- <section id="SideNav" class="hidden md:flex">
      <nav class="w-16 bg-zinc-800 h-full z-40 border-r-2 border-zinc-600">
        <slot name="side-nav" />
      </nav>
    </section> -->

    <section
      id="MainContent"
      class="flex flex-col h-screen flex-1 w-full max-w-[100vw]"
    >
      <!-- Top fixed panel -->
      <section
        id="TopFixedPanel"
        v-if="$route.meta.hasTopPanel"
        class="h-14 items-center flex w-full z-50 bg-zinc-800 text-white"
      ></section>

      <!-- Main Content area -->
      <main
        class="flex-1 flex bg-zinc-900 text-white h-0"
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

        <div class="flex flex-1">
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
        class="flex flex-col z-40"
        :class="{
          'h-16': !isBottomPanelExpanded,
          'transition-all': !isDragging,
        }"
        :style="`height: ${
          isBottomPanelExpanded ? `${bottomPanelHeight}px` : '2.5rem'
        }`"
        v-if="$route.meta.hasBottomPanel"
      >
        <div
          @click="isBottomPanelExpanded = true"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
          :class="{
            'hover:bg-blue-400 cursor-row-resize': isBottomPanelExpanded,
            '!bg-blue-500': isDragging,
          }"
          class="w-full h-1 bg-zinc-600 transition-colors"
        />
        <!-- Panel Control + Indicator -->
        <div class="flex justify-between py-1 px-2 h-10 bg-zinc-700 text-white">
          <div class="flex-1" id="BottomPanelBanner" />

          <div class="flex items-center justify-center">
            <button
              aria-label="Toggle Bottom Panel"
              :aria-pressed="isBottomPanelExpanded"
              @click="isBottomPanelExpanded = !isBottomPanelExpanded"
              class="mr-2"
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
            </button>
          </div>
        </div>

        <div
          id="BottomPanelContent"
          class="flex-1 flex overflow-auto bg-zinc-900 text-zinc-50 font-mono"
        />
      </section>
    </section>
  </div>
</template>
