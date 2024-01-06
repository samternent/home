<script setup>
import { computed } from "vue";
import { SNavTabs } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/apps",
  name: "Apps",
});
const tabs = computed(() => [
  // {
  //   title: "Murder Mystery?",
  //   path: "/apps/murder-mystery",
  // },
  {
    title: "Sweet Shop",
    path: "/apps/sweet-shop",
  },
  {
    title: "Game",
    path: "/apps/game",
  },
]);
</script>
<template>
  <div class="flex flex-col h-full flex-1">
    <SNavTabs :items="tabs" title="Apps" :path="$route.path" :exact="true" />
    <div class="flex flex-1 overflow-auto relative">
      <RouterView />
    </div>
  </div>
</template>
