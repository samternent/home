<script setup>
import { shallowRef, onMounted, onBeforeUnmount } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  SNavBar,
  SBreadcrumbs,
  SButton,
  SBrandHeader,
} from "ternent-ui/components";
import { useBreadcrumbs } from "../module/breadcrumbs/useBreadcrumbs";
import { useAppShell } from "../module/app-shell/useAppshell";
import ConcordsLog from "../module/concords/ConcordsLog.vue";

const { isBottomPanelExpanded, bottomPanelHeight } = useAppShell();

const isDragging = shallowRef(false);

const breadcrumbs = useBreadcrumbs({
  path: "/",
  name: "Home",
});

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
</script>
<template>
  <div
    class="flex flex-col flex-1 min-h-screen max-h-screen h-screen overflow-hidden"
  >
    <SNavBar>
      <template #nav>
        <SButton
          type="primary"
          class="btn btn-ghost btn-sm"
          @click="openSideBar = !openSideBar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            data-slot="icon"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </SButton>
      </template>
      <template #start>
        <SBreadcrumbs :breadcrumbs="breadcrumbs" />
      </template>
      <template #end>
        <SButton type="" to="/settings" class="btn btn-ghost btn-sm text-base">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </SButton>
        <RouterLink to="/" class="btn btn-ghost btn-sm text-base md:!hidden"
          ><SBrandHeader size="sm" class="font-light"
            >t</SBrandHeader
          ></RouterLink
        >
      </template>
    </SNavBar>
    <div class="flex flex-col flex-1 overflow-auto">
      <div class="flex-1 overflow-auto w-full">
        <RouterView />
      </div>
      <!-- Bottom expandable panel -->
      <section
        class="flex flex-col z-20"
        :class="{
          'h-16': !isBottomPanelExpanded,
          'transition-all': !isDragging,
        }"
        :style="`height: ${
          isBottomPanelExpanded ? `${bottomPanelHeight}px` : '2.5rem'
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
          class="flex justify-between py-1 px-2 h-10 border-b border-base-300 bg-base-200"
        >
          <div class="flex-1" />

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

        <div class="flex-1 flex overflow-auto bg-base-100 font-thin text-sm">
          <ConcordsLog />
        </div>
      </section>
    </div>
  </div>
</template>
