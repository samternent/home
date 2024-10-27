<script setup>
import { DateTime } from "luxon";
import IdentityAvatar from "../identity/IdentityAvatar.vue";
import VerifyRowCell from "../table/VerifyRowCell.vue";
import { SButton } from "ternent-ui/components";

defineProps({
  records: {
    type: Array,
    required: true,
  },
  canRemove: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["removeRecord"]);

function formatTime(time) {
  const date = DateTime.fromMillis(time);
  return date.toLocaleString(DateTime.DATETIME_MED);
}
</script>
<template>
  <table class="table table-sm max-w-full">
    <thead>
      <tr>
        <th>Collection</th>
        <th>Identity</th>
        <th>Timestamp</th>
        <th>Verified</th>
        <th>Data</th>
        <th v-if="canRemove">Remove</th>
      </tr>
    </thead>
    <tbody>
      <tr class="m-0 !p-0" v-for="record in records" :key="record.id">
        <td class="text-xs font-light">
          <span class="font-light text-sm">{{ record.collection }}</span>
        </td>
        <td class="text-xs font-light">
          <IdentityAvatar :identity="record.identity" size="xs" class="mr-2" />
        </td>
        <td class="min-w-32 text-xs">
          {{ formatTime(record.timestamp) }}
        </td>
        <td>
          <VerifyRowCell v-bind="{ ...record }" />
        </td>
        <td class="overflow-x-auto max-w-64 text-xs">
          <div class="flex flex-col">
            <div class="grid grid-flow-col">
              <div
                v-for="key of Object.keys(record.data)"
                :key="key"
                class="w-32 truncate font-medium"
              >
                {{ key }}
              </div>
            </div>
            <div class="grid grid-flow-col">
              <div
                v-for="key of Object.keys(record.data)"
                :key="key"
                class="w-32 truncate"
              >
                <span class="italic">{{ record.data[key] }}</span>
              </div>
            </div>
          </div>
        </td>
        <td v-if="canRemove">
          <SButton
            class="ma-2 btn-sm"
            variant="error"
            color="red-lighten-2"
            @click="$emit('removeRecord', record)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 text-error"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </SButton>
        </td>
      </tr>
    </tbody>
  </table>
</template>
