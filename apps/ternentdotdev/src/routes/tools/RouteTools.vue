<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { STabs } from "ternent-ui/components";
import { computed } from "vue";
useBreadcrumbs({
  path: "/tools",
  name: "Tools",
});

const navTabs = computed(() => {
  return [
    {
      title: "Compression",
      path: `/tools/compression`,
    },
    {
      title: "Encryption",
      path: `/tools/encryption`,
    },
  ];
});
</script>
<template>
  <div class="flex w-full flex-col flex-1">
    <nav class="py-2 text-sm">
      <STabs :items="navTabs" :path="$route.path" :exact="true" />
    </nav>
    <RouterView />
  </div>
</template>
