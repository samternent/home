<script setup>
import { DateTime } from "luxon";
import IdentityAvatar from "../identity/IdentityAvatar.vue";
import VerifyRowCell from "../table/VerifyRowCell.vue";

defineProps({
  records: {
    type: Array,
    required: true,
  },
});

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
                <IdentityAvatar
                  v-if="key === 'identity'"
                  :identity="record.data[key]"
                  size="xs"
                  class="mr-2"
                />
                <span v-else class="italic">{{ record.data[key] }}</span>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
