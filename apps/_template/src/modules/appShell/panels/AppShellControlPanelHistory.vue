<script setup lang="ts">
import { computed } from "vue";
import { useLedger } from "@/modules/ledger";
import { VerifyRowCell, IdentityAvatarCell } from "@/modules/table";
import { IdentityAvatar } from "@/modules/identity";
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
      <li
        v-for="block in [...(ledger?.chain || [])].reverse()"
        :key="block.id"
        class="my-2 rounded"
      >
        <div class="font-medium text-zinc-500">
          <div v-if="block.last_hash && block.last_hash != '0'">
            previous hash: {{ block.last_hash }}
          </div>
          <div v-else>genesis block</div>
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
                  v-for="record in [...(block.records || [])].reverse()"
                  :key="record.id"
                  class="my-2 rounded"
                >
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
                      {{ formatTime(block.timestamp) }}
                    </div>
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
