<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/changelog",
  name: "Changelogs",
});
</script>
<template>
  <div class="flex-1 flex w-full p-4 bg-base-100">
    <RouterView />
  </div>
</template>
