<script setup lang="ts">
import { computed } from "vue";
import { useLedger } from "@/modules/ledger";

const { ledger } = useLedger();

const size = computed(
  () => new TextEncoder().encode(JSON.stringify(ledger.value)).length
);
const sizeInKb = computed(() => size.value / 1024);
const sizeInMb = computed(() => sizeInKb.value / 1024);
</script>
<template>
  <div v-if="ledger" class="flex h-full flex-1 items-center justify-between">
    <div
      class="px-2.5 py-0.5 bg-pink-600 text-white rounded-full text-xs font-medium"
    >
      {{ ledger.pending_records.length }}
    </div>
    <div class="px-4 text-sm text-zinc-100">
      {{
        sizeInMb > 1
          ? `${Math.round((sizeInMb + Number.EPSILON) * 100) / 100} MB`
          : `${Math.floor(sizeInKb)} KB`
      }}
    </div>
  </div>
</template>
