<script setup lang="ts">
import { computed } from "vue";
import { useLedger } from "@/modules/ledger";
import { VerifyRowCell } from "@/modules/table";
import { DateTime } from "luxon";

function formatTime(time: number) {
  const date = DateTime.fromMillis(time);
  return date.toLocaleString(DateTime.DATETIME_MED);
}

const { ledger } = useLedger();

const records = computed(() => {
  return;
});
</script>
<template>
  <div>
    <ul class="flex flex-col">
      <li v-for="block in ledger?.chain" :key="block.id" class="my-2 rounded">
        <div class="font-medium text-zinc-500">
          <div v-if="block.last_hash && block.last_hash != '0'">
            previous hash: {{ block.last_hash }}
          </div>
          <div>hash: {{ block.hash }}</div>
          {{ formatTime(block.timestamp) }}
          <div v-if="block.message" class="text-zinc-400">
            Commit message: {{ block.message }}
          </div>
        </div>
        <VExpansionPanels>
          <VExpansionPanel :title="`${block.records.length} record(s)`">
            <VExpansionPanelText>
              <ul class="flex flex-col">
                <li
                  v-for="record in block.records"
                  :key="record.id"
                  class="my-2 rounded"
                >
                  <div class="flex w-full justify-start">
                    <VerifyRowCell v-bind="{ ...record }" />
                    <div class="pl-2">{{ formatTime(block.timestamp) }}</div>
                  </div>
                  <div class="font-bold text-zinc-400 my-2">
                    Collection: {{ record.collection }}
                  </div>
                  <pre class="overflow-x-auto">{{ record.data }}</pre>
                </li>
              </ul>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </li>
    </ul>
  </div>
</template>
