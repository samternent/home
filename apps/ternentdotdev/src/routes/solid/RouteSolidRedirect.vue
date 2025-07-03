<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSolid } from "@/module/solid/useSolid";

const router = useRouter();
const { handleSessionLogin } = useSolid();

onMounted(async () => {
  try {
    await handleSessionLogin();
    const lastPath = window.localStorage.getItem("app/lastPath") || "/ledger";
    setTimeout(() => {
      router.replace(lastPath);
    }, 500);
  } catch (error) {
    console.error("Error handling Solid redirect:", error);
    router.replace("/solid");
  }
});
</script>
<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg"></div>
      <p class="mt-4">Connecting to your Solid pod...</p>
    </div>
  </div>
</template>
