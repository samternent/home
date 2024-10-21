<script setup>
import { computed } from "vue";
import { DateTime } from "luxon";
import { useLedger } from "../ledger/useLedger";
import IdentityAvatar from "../identity/IdentityAvatar.vue";
import VerifyRowCell from "../table/VerifyRowCell.vue";

const { ledger, api } = useLedger();

const blocks = computed(() => {
  return [...(ledger.value?.records || [])].reverse();
});
function formatTime(time) {
  const date = DateTime.fromMillis(time);
  return date.toLocaleString(DateTime.DATETIME_MED);
}
</script>
<template>
  <div
    class="flex flex-col w-full flex-1 bg-base-200 overflow-auto"
    v-if="blocks.length"
  >
    <ul class="flex-1 mx-4 border-x">
      <li v-for="record in blocks" :key="record.id">
        <div
          class="flex w-full justify-between items-center bg-base-200 py-2 px-4"
        >
          <div class="items-center flex gap-2">
            <IdentityAvatar
              :identity="record.identity"
              size="xs"
              class="mr-2"
            />
            <span class="font-light text-sm">{{ record.collection }}</span>
          </div>

          <div class="items-center flex gap-2">
            <div class="text-xs">
              {{ formatTime(record.timestamp) }}
            </div>
            <VerifyRowCell v-bind="{ ...record }" />
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
        </div>
        <div class="px-4 py-2 bg-base-100">
          <div
            class="flex gap-2"
            v-for="key of Object.keys(record.data)"
            :key="key"
          >
            <span class="text-sm">{{ key }}: </span>
            <strong class="text-sm">{{ record.data[key] }}</strong>
          </div>
        </div>
      </li>
    </ul>
  </div>
  <div v-else class="p-4 text-zinc-400">No pending records</div>
</template>
