<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "../../module/app/AppLayout.vue";
import PixPaxControlNav from "../../module/pixpax/ui/PixPaxControlNav.vue";

const router = useRouter();
const brandTo = computed(() => router.resolve({ name: "pixpax-main" }).fullPath);
</script>

<template>
  <AppLayout
    brand-label="PixPax"
    :brand-to="brandTo"
    badge-label="CONTROL"
    :show-badge="true"
  >
    <template #left-side>
      <PixPaxControlNav />
    </template>
    <div class="h-full w-full overflow-auto bg-[image:var(--bg-pixpax)]">
      <RouterView />
    </div>
  </AppLayout>
</template>
