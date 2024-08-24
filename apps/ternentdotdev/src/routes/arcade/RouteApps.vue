<script setup>
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/arcade",
  name: "Arcade",
});
</script>
<template>
  <RouterView />
</template>
