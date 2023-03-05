<script setup lang="ts">
import { useLedger } from "@/modules/ledger";

const { ledger } = useLedger();
</script>
<template>
  <div v-if="ledger" class="flex h-full flex-1 items-center">
    <div
      v-if="ledger.pending_records.length"
      class="px-2.5 py-0.5 bg-pink-600 text-white rounded-full text-xs font-medium"
    >
      {{ ledger.pending_records.length }}
    </div>
  </div>
</template>
