<script setup lang="ts">
import { computed } from "vue";
import { useLedger } from "@/modules/ledger";
import { VerifyRowCell } from "@/modules/table";
import { IdentityAvatar } from "@/modules/identity";
import { DateTime } from "luxon";

const { ledger, api } = useLedger();

const records = computed(() => {
  return [...(ledger.value?.pending_records || [])].reverse();
});
function formatTime(time: number) {
  const date = DateTime.fromMillis(time);
  return date.toLocaleString(DateTime.DATETIME_MED);
}
</script>
<template>
  <ul class="flex flex-col" v-if="records.length">
    <li v-for="record in records" :key="record.id" class="my-2 rounded">
      <div class="flex w-full justify-start items-center">
        <VTooltip :text="record.identity" location="bottom">
          <template v-slot:activator="{ props }">
            <IdentityAvatar
              v-bind="props"
              :identity="record.identity"
              size="xs"
              class="mr-2"
            />
          </template>
        </VTooltip>
        <VerifyRowCell v-bind="{ ...record }" />
        <div class="pl-4 text-xs">
          {{ formatTime(record.timestamp) }}
        </div>
        <VTooltip text="Delete record" location="bottom">
          <template v-slot:activator="{ props }">
            <VBtn
              v-bind="props"
              class="ma-2"
              variant="text"
              color="red-lighten-2"
              @click="api.removePendingRecord(record)"
              ><svg
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
            </VBtn>
          </template>
        </VTooltip>
      </div>
      <div class="font-bold text-zinc-400 my-2">
        Collection: {{ record.collection }}
      </div>
      <pre class="overflow-x-auto">{{ record.data }}</pre>
      <!-- <table class="table-fixed w-full overflow-x-scroll">
          <thead class="bg-indigo-800">
            <th
              v-for="header in Object.keys(record.data)"
              :key="header"
              class="p-2"
            >
              {{ header }}
            </th>
          </thead>
          <tbody>
            <tr>
              <td v-for="header in Object.keys(record.data)" :key="header">
                <div class="truncate break-all p-2">
                  {{ record.data[header] }}
                </div>
              </td>
            </tr>
          </tbody>
        </table> -->
    </li>
  </ul>
  <div v-else class="p-4 text-zinc-400">No pending records</div>
</template>
