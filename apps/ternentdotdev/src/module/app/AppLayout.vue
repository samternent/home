<script setup>
import { shallowRef, onMounted, onBeforeUnmount } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  SNavBar,
  SBreadcrumbs,
  SButton,
  SBrandHeader,
} from "ternent-ui/components";
import { useBreadcrumbs } from "../breadcrumbs/useBreadcrumbs";
import { useAppShell } from "../app-shell/useAppShell";
// import ConcordsLog from "../module/concords/ConcordsLog.vue";
import SideNav from "../side-nav/SideNav.vue";

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
  <div class="flex flex-1 bg-base-100 border border-base-300 shadow-lg w-full">
    <SideNav />
    <div class="flex flex-col flex-1 h-full w-full overflow-hidden">
      <SNavBar>
        <template #nav> <slot name="nav" /> </template>
        <template #start> <slot name="navStart" /> </template>
        <template #end> <slot name="navEnd" /> </template>
      </SNavBar>
      <slot>
        <RouterView />
      </slot>
    </div>
  </div>
</template>
