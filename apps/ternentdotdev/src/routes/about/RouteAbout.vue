<script setup>
import { computed } from "vue";
import { SNavTabs } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/about",
  name: "About",
});
const tabs = computed(() => [
  {
    title: "Who?",
    path: "/about/who",
  },
  {
    title: "CV",
    path: "/about/cv",
  },
]);
</script>
<template>
  <div class="flex flex-col h-full flex-1">
    <SNavTabs :items="tabs" title="About" :path="$route.path" :exact="true" />
    <RouterView />
  </div>
</template>
