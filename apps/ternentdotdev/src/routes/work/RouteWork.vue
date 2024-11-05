<script setup>
import { computed } from "vue";
// import { SNavTabs } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/work",
  name: "Work",
});
const tabs = computed(() => [
  {
    title: "FootballSocial",
    path: "/work/football-social",
  },
  {
    title: "Concords",
    path: "/work/concords",
  },
  {
    title: "Teamwork.com",
    path: "/work/teamwork",
  },
  // {
  //   title: "GZip",
  //   path: "/work/gzip",
  // },
]);
</script>
<template>
  <div class="flex flex-col h-full flex-1">
    <!-- <SNavTabs :items="tabs" title="Work" :path="$route.path" :exact="true" /> -->
    <div class="flex-1 overflow-y-auto">
      <RouterView />
    </div>
  </div>
</template>
