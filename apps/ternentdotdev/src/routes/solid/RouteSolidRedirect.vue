<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
onMounted(() => {
  const lastPath = window.localStorage.getItem("app/lastPath");
  if (lastPath) {
    setTimeout(() => {
      router.replace(lastPath);
    }, 500);
  }
});
</script>
<template></template>
