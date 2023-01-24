<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { TableBuilder } from "@/modules/builder";

const { ledger, getCollections } = useLedger();

const collections = shallowRef<Array<Object>>([]);
watch(
  ledger,
  () => {
    const cols = getCollections();
    collections.value =
      Object.keys(cols).map((collectionName) => ({
        name: collectionName,
        data: cols[collectionName]?.data,
      })) || [];

    console.log(collections.value);
  },
  { immediate: true }
);
</script>
<template>
  <h1 class="text-6xl">Woohoo! 👏 🎉</h1>
  <p class="mt-4">
    Well done! You've created your first Ledger. Now lets expore what we can do
    with it...
  </p>
  <TableBuilder :tables="collections" />
</template>
