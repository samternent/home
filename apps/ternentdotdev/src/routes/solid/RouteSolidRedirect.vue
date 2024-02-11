<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
onMounted(() => {
  const lastPath = window.localStorage.getItem("app/lastPath");
  if (lastPath) {
    setTimeout(() => {
      router.push(lastPath);
    }, 500);
  }
});
</script>
<template></template>
