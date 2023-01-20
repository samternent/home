<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";
import inputTypes from "@/utils/inputTypes";

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
      <div
        v-for="itemType in itemTypes"
        :key="itemType.id"
        disabled
        class="mr-1"
      >
        {{ itemType.data?.name }}
        {{ itemType.data?.type }}
      </div>
    </div>
    <hr />
    <div @keyup.enter="addItemType" class="flex">
      <input v-model="name" placeholder="Name" class="mr-1" />
      <FormKit
        type="select"
        v-model="type"
        placeholder="Type"
        :options="inputTypes"
        class="mr-1"
      />
      <button @click="addItemType">Add Type</button>
    </div>
  </div>
</template>
