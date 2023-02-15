<script lang="ts" setup>
import { shallowRef, watchEffect, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "@concords/proof-of-work";
import inputTypes from "@/utils/inputTypes";

const props = defineProps({
  table: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["submit"]);

const { ledger, getCollection, addItem } = useLedger();
const tableName = shallowRef<String>(props.table);

const type = shallowRef<string>("text");
const name = shallowRef<string>("");
const itemTypes = shallowRef<Array<IRecord>>([]);
const permission = shallowRef<string | null>(null);

async function addItemType() {
  await addItem(
    {
      name: name.value,
      type: type.value,
    },
    `${tableName.value}:types`
  );

  name.value = "";
  emit("submit", tableName);
}
async function addItemTypePermission() {
  if (!permission.value) {
    return;
  }
  await addItem(
    {
      name: "permission",
      type: permission.value,
    },
    `${tableName.value}:types`
  );

  name.value = "";
}

watchEffect(() => {
  if (tableName.value) {
    try {
      itemTypes.value = getCollection(`${tableName.value}:types`)?.data;
    } catch (err) {}
  }
});

watch(ledger, () => {
  itemTypes.value = getCollection(`${tableName.value}:types`)?.data;
});
</script>
<template>
  <VTextField
    placeholder="Table name"
    v-model="tableName"
    :disabled="Boolean(itemTypes?.length)"
  />
  <table class="border-2 rounded-xl border-[#3c3c3c] table-fixed w-full">
    <thead>
      <tr>
        <th
          class="px-5 py-3 border-b-2 border-[#3c3c3c] text-left text-xs font-semibold uppercase tracking-wider"
        >
          name
        </th>
        <th
          class="px-5 py-3 border-b-2 border-[#3c3c3c] text-left text-xs font-semibold uppercase tracking-wider"
        >
          type
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in itemTypes" :key="item.id">
        <td class="px-5 py-1 border-b border-[#3c3c3c] text-sm">
          {{ item?.data?.name }}
        </td>
        <td class="px-5 py-1 border-b border-[#3c3c3c] text-sm">
          {{ item?.data?.type }}
        </td>
      </tr>
    </tbody>
  </table>
  <!-- Default permission
  <PermissionPicker v-model="permission" /> -->
  <div class="my-8 w-full flex items-grow justify-between">
    <div class="px-5 py-1 text-sm flex-1" @keyup.enter="addItemType">
      <FormKit type="text" v-model="name" placeholder="key" class="mr-1" />
    </div>
    <div class="px-5 py-1 text-sm flex-1">
      <VSelect
        v-model="type"
        placeholder="datatype"
        :items="inputTypes"
        density="compact"
      />
    </div>
    <VBtn color="success" :disabled="!tableName" @click="addItemType"
      >Add Type</VBtn
    >
  </div>
</template>
