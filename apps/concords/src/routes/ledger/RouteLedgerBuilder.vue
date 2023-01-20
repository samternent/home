<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";

const { ledger, getCollection, addItem } = useLedger();
const itemTypes = shallowRef<Array<IRecord>>([]);

const type = shallowRef<string>("");
const name = shallowRef<string>("");

watch(
  ledger,
  () => {
    itemTypes.value = getCollection("item:types")?.data;
  },
  { immediate: true }
);

async function addItemType() {
  await addItem(
    {
      name: name.value,
      type: type.value,
    },
    "item:types"
  );

  type.value = "";
  name.value = "";
}
</script>

<template>
  <div>
    <div>
      <FormKit
        v-for="itemType in itemTypes"
        :placeholder="itemType.data.name"
        :type="itemType.data.type"
        :key="itemType.id"
        disabled
        class="mr-1"
      />
    </div>
    <hr />
    <div @keyup.enter="addItemType" class="flex">
      <input v-model="name" placeholder="Name" class="mr-1" />
      <input v-model="type" placeholder="Type" class="mr-1" />
      <button @click="addItemType">Add Type</button>
    </div>
  </div>
</template>
