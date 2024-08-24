<script setup>
import { shallowRef, onMounted, onBeforeUnmount } from "vue";
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { useAppShell } from "../app-shell/useAppShell";
import SideNav from "../side-nav/SideNav.vue";
import { SButton } from "ternent-ui/components";

const breakpoints = useBreakpoints(breakpointsTailwind);
const smallerThanMd = breakpoints.smaller("md");

const { isBottomPanelExpanded, bottomPanelHeight } = useAppShell();

const isDragging = shallowRef(false);

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
    class="flex-1 w-full relative bg-base-100 mx-auto h-full flex overflow-hidden z-10"
  >
    <SideNav />

    <slot name="drawer" />
    <div class="flex flex-col flex-1 h-full w-full overflow-auto">
      <slot name="nav" />
      <slot />
    </div>
  </div>
</template>
