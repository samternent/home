<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/app",
  name: "App",
});
</script>
<template>
  <RouterView />
</template>
