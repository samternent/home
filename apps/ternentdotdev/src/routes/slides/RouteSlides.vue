<script setup>
import { shallowRef, onMounted, onBeforeUnmount, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { STabs, SButton, SIndicator } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useAppShell } from "../../module/app-shell/useAppShell";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import { useLedger } from "../../module/ledger/useLedger";

const { isBottomPanelExpanded, bottomPanelHeight } = useAppShell();

const isDragging = shallowRef(false);
const { ledger } = useLedger();

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
  path: "/s",
  name: "Slides",
});
</script>
<template>
  <div
    class="flex h-full bg-base-100 border border-base-300 shadow-lg rounded w-full overflow-hidden"
  >
    <RouterView />
  </div>
</template>
