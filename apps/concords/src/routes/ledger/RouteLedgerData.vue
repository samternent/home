<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";

const { ledger, getCollection } = useLedger();
const items = shallowRef<Array<IRecord>>([]);
const itemTypes = shallowRef<Array<IRecord>>([]);

watch(
  ledger,
  () => {
    items.value = getCollection("items")?.data;
    itemTypes.value = getCollection("item:types")?.data;
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <div v-for="item in items" :key="item.id">
      <span
        v-for="itemType in itemTypes"
        :key="`${item.id}_${itemType.id}`"
        class="mx-1"
      >
        {{ item.data[itemType.data.name] }}
      </span>
    </div>
  </div>
</template>
