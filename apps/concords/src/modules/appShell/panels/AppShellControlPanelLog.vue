<script setup lang="ts">
import { computed } from "vue";
import { useLedger } from "@/modules/ledger";

const { ledger } = useLedger();

const records = computed(() => {
  return ledger.value?.pending_records;
});
</script>
<template>
  <div>
    <pre class="text-green-600 font-medium tracking-wider">
// concords.app is in development.

</pre
    >
    <ul>
      <li v-for="record in records" :key="record.id" class="break-all">
        <div>{{ record.collection }}</div>
        <table class="w-full table-auto">
          <thead>
            <th
              v-for="header in Object.keys(record.data)"
              :key="header"
              class="w-64"
            >
              {{ header }}
            </th>
          </thead>
          <tbody>
            <tr>
              <td v-for="header in Object.keys(record.data)" :key="header">
                <span class="truncate max-w-64 break-all">{{
                  record.data[header]
                }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </li>
    </ul>
  </div>
</template>
