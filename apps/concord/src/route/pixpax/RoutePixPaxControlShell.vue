<script setup lang="ts">
import AppLayout from "../../module/app/AppLayout.vue";
import PixPaxControlNav from "../../module/pixpax/ui/PixPaxControlNav.vue";
</script>

<template>
  <AppLayout
    brand-label="PixPax"
    brand-to="/pixpax/control"
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
