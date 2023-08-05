<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "concords-proof-of-work";

interface dynamicObject {
  [key: string]: string | number;
}
const { ledger, getCollection, addItem, addEncrypted } = useLedger();
const items = shallowRef<Array<IRecord>>([]);
const itemTypes = shallowRef<Array<IRecord>>([]);

const newItem = shallowRef<dynamicObject>({});

const type = shallowRef<string>("");
const name = shallowRef<string>("");

const permission = shallowRef();

watch(
  ledger,
  () => {
    items.value = getCollection("items")?.data;
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
    <hr />
    <div @keyup.enter="addItemType" class="flex">
      <input v-model="name" placeholder="Name" class="mr-1" />
      <input v-model="type" placeholder="Type" class="mr-1" />
      <button @click="addItemType">Add Type</button>
    </div>
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
  </div>
</template>
