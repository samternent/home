<script setup>
import { computed } from "vue";
import { useLedgerApps } from "@/module/ledger/useLedgerApps";
import LedgerAppRunner from "@/module/ledger/LedgerAppRunner.vue";

const props = defineProps({
  appId: {
    type: String,
    required: true
  }
});

const { apps } = useLedgerApps();

const app = computed(() => {
  return apps.value.find(a => a.id === props.appId) || null;
});
</script>

<template>
  <div v-if="app" class="h-full">
    <LedgerAppRunner :app="app" />
  </div>
  
  <div v-else class="h-full flex items-center justify-center">
    <div class="text-center">
      <div class="text-4xl mb-4">❓</div>
      <h2 class="text-xl font-bold mb-2">App Not Found</h2>
      <p class="text-base-content/70">
        The app you're looking for doesn't exist or has been deleted.
      </p>
    </div>
  </div>
</template>
