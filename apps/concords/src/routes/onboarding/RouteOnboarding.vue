<script setup lang="ts">
import { useRouter } from "vue-router";
import { useLoadingBar } from "naive-ui";

const router = useRouter();
const loadingBar = useLoadingBar();

router.beforeEach(loadingBar.start);
router.afterEach(loadingBar.finish);
</script>
<template>
  <div class="flex flex-col py-4">
    <RouterView />
  </div>
</template>
