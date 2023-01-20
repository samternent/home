<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "@concords/proof-of-work";

interface dynamicObject {
  [key: string]: string | number;
}
const { ledger, getCollection, addItem } = useLedger();
const itemTypes = shallowRef<Array<IRecord>>([]);

const newItem = shallowRef<dynamicObject>({});

const permission = shallowRef();

watch(
  ledger,
  () => {
    itemTypes.value = getCollection("item:types")?.data;
  },
  { immediate: true }
);

function updateItem(e: Event, name: string) {
  const val = (e.target as HTMLTextAreaElement).value;
  newItem.value = { ...newItem.value, [name]: val };
}

async function addListItem() {
  await addItem({ ...newItem.value }, "items", permission.value);
  newItem.value = {};
}
</script>

<template>
  <div>
    <div @keyup.enter="addListItem">
      <FormKit
        v-for="itemType in itemTypes"
        @change="updateItem($event, itemType.data.name)"
        :placeholder="itemType.data.name"
        :type="itemType.data.type"
        :key="itemType.id"
        :value="newItem[itemType.data.name]"
        class="mr-1"
      />
      <PermissionPicker v-model="permission" />
      <button @click="addListItem">Add</button>
    </div>
  </div>
</template>
