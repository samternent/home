<script setup>
import { computed } from "vue";
import { useLedger } from "../ledger/useLedger";
import LedgerRecordRow from "../ledger/LedgerRecordRow.vue";

const { ledger } = useLedger();

const records = computed(() => {
  return [...(ledger.value?.pending_records || [])].reverse();
});
</script>
<template>
  <div
    class="flex flex-col flex-1 overflow-y-scroll mx-4 bg-base-100 border-x border-base-300"
  >
    <LedgerRecordRow v-if="records.length" :records="records" />
    <div v-else class="flex flex-1 items-center justify-center">
      No pending records
    </div>
  </div>
</template>
