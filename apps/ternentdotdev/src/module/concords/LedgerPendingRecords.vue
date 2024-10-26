<script setup>
import { computed } from "vue";
import { useLedger } from "../ledger/useLedger";
import LedgerRecords from "../ledger/LedgerRecords.vue";

const { ledger, api } = useLedger();

const records = computed(() => {
  return [...(ledger.value?.pending_records || [])].reverse();
});
</script>
<template>
  <div
    class="flex flex-col flex-1 overflow-y-scroll mx-4 bg-base-100 border-x border-base-300"
  >
    <LedgerRecords
      v-if="records.length"
      :records="records"
      :canRemove="true"
      @removeRecord="api.removePendingRecord"
    />
    <div v-else class="flex flex-1 items-center justify-center">
      No pending records
    </div>
  </div>
</template>
