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
    <ul class="flex flex-col">
      <li v-for="record in records" :key="record.id" class="my-2 rounded">
        <div class="font-bold text-zinc-400">
          {{ record.collection }}
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
  </div>
</template>
