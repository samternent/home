<script setup>
import { computed } from "vue";
import { DateTime } from "luxon";
import { useLedger } from "../ledger/useLedger";
import IdentityAvatar from "../identity/IdentityAvatar.vue";

const { ledger, api } = useLedger();

const records = computed(() => {
  return [...(ledger.value?.pending_records || [])].reverse();
});
function formatTime(time) {
  const date = DateTime.fromMillis(time);
  return date.toLocaleString(DateTime.DATETIME_MED);
}
</script>
<template>
  <ul class="flex flex-col" v-if="records.length">
    <li v-for="record in records" :key="record.id" class="my-2 rounded">
      <div class="flex w-full justify-start items-center">
        <IdentityAvatar :identity="record.identity" size="xs" class="mr-2" />
        <!-- <VerifyRowCell v-bind="{ ...record }" /> -->
        <div class="pl-4 text-xs">
          {{ formatTime(record.timestamp) }}
        </div>

        <button
          class="ma-2"
          variant="text"
          color="red-lighten-2"
          @click="api.removePendingRecord(record)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
      <div class="font-bold text-zinc-400 my-2">
        Collection: {{ record.collection }}
      </div>
      <pre class="overflow-x-auto">{{ JSON.stringify(record.data) }}</pre>
    </li>
  </ul>
  <div v-else class="p-4 text-zinc-400">No pending records</div>
</template>
