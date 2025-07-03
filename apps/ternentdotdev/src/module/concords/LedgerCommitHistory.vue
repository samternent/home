<script setup>
import { shallowRef } from "vue";
import { computedAsync } from "@vueuse/core";
import { DateTime } from "luxon";
import { importPublicKeyFromPem, verifyJson } from "ternent-identity";
import { useLedger } from "../ledger/useLedger";
import IdentityAvatar from "../identity/IdentityAvatar.vue";
import LedgerRecords from "../ledger/LedgerRecords.vue";

import { SButton } from "ternent-ui/components";

const { ledger, api } = useLedger();

const blocks = computedAsync(async () => {
  const blocks = await Promise.all(
    [...(ledger.value?.chain || [])].reverse().map(verifyBlock)
  );

  return blocks;
});
function formatTime(time) {
  const date = DateTime.fromMillis(time);
  return date.toLocaleString(DateTime.DATETIME_MED);
}

const expandedMap = shallowRef({});

function toggleExpanded(hash) {
  expandedMap.value = {
    ...expandedMap.value,
    [hash]: !expandedMap.value[hash],
  };
}

async function verifyRecord(record) {
  const { data, identity, collection, timestamp, id, signature } = record;
  const key = await importPublicKeyFromPem(identity);

  return verifyJson(
    signature,
    {
      id,
      data: data.encrypted
        ? {
            permission: data.permission,
            encrypted: data.encrypted,
          }
        : data,
      timestamp: timestamp,
      identity: identity,
      collection: collection,
    },
    key
  );
}

async function verifyBlock(block) {
  const verified = await Promise.all(
    block.records.map((record) => verifyRecord(record))
  );

  expandedMap.value = {
    ...expandedMap.value,
    [block.hash]: expandedMap.value[block.hash] || false,
  };

  return {
    ...block,
    verified: verified.every((v) => v),
  };
}
</script>
<template>
  <div
    class="flex flex-col flex-1 overflow-y-scroll mx-4 mr-8 bg-base-100 border-x border-base-300 p-2"
  >
    <div
      v-if="blocks?.length"
      class="flex flex-col mb-0 pb-0"
      v-for="(block, i) in blocks"
      :key="block.hash"
    >
      <div class="flex justify-between items-center px-2 py-1">
        <p class="flex">
          <IdentityAvatar :identity="block.identity" size="xs" class="mr-2" />
          <strong class="text-sm text-blue-500 mr-2">{{
            block.hash.slice(0, 6)
          }}</strong>
          <span class="text-sm"
            >{{ i < blocks.length - 1 ? block.message : "Ledger created" }}
          </span>
        </p>
        <div class="flex items-center">
          <span class="text-xs mr-2">{{ formatTime(block.timestamp) }} </span>
          <svg
            v-if="block.verified"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 text-success"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3"
            stroke="currentColor"
            class="w-6 h-6 text-error"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
            />
          </svg>
          <SButton
            aria-label="Toggle Bottom Panel"
            :aria-pressed="expandedMap[block.hash]"
            @click="toggleExpanded(block.hash)"
            type="ghost"
            class="mr-2 btn-xs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 transition-transform duration-300 transform-gpu"
              :class="expandedMap[block.hash] ? 'rotate-0' : 'rotate-180'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </SButton>
        </div>
      </div>
      <Transition>
        <div
          v-if="expandedMap[block.hash]"
          class="w-full bg-base-200 border border-base-300 my-2"
        >
          <LedgerRecords :records="block.records" />
        </div>
      </Transition>
    </div>
    <div v-else class="flex flex-1 items-center justify-center">No history</div>
  </div>
</template>
