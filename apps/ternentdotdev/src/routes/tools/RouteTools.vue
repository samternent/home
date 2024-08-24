<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/tools",
  name: "Tools",
});
</script>
<template>
  <div class="flex w-full">
    <RouterView />
  </div>
</template>
