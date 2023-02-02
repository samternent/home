<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { LayoutHeaderTitle } from "@/modules/layout";
import type { IRecord } from "@concords/proof-of-work";
import inputTypes from "@/utils/inputTypes";

const props = defineProps({
  tableName: {
    type: String,
    required: true,
  },
});

const { ledger, getCollection, addItem } = useLedger();

const type = shallowRef<string>("text");
const name = shallowRef<string>("");
const itemTypes = shallowRef<Array<IRecord>>([]);

watch(
  ledger,
  () => {
    itemTypes.value = getCollection(`${props.tableName}:types`)?.data;
  },
  { immediate: true }
);

async function addItemType() {
  await addItem(
    {
      name: name.value,
      type: type.value,
    },
    `${props.tableName}:types`
  );

  name.value = "";
}
</script>
<template>
  <LayoutHeaderTitle title="Create a table" />
  <table class="border-2 rounded-xl border-[#3c3c3c] mt-10">
    <thead>
      <tr>
        <th
          colspan="2"
          class="px-5 py-3 border-b-2 border-[#3c3c3c] text-left text-xs font-semibold uppercase tracking-wider"
        >
          {{ tableName }}
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
  <div class="my-8 w-full flex items-grow justify-between">
    <div class="px-5 py-1 text-sm flex-1" @keyup.enter="addItemType">
      <FormKit type="text" v-model="name" placeholder="key" class="mr-1" />
    </div>
    <div class="px-5 py-1 text-sm flex-1">
      <FormKit
        type="select"
        v-model="type"
        placeholder="datatype"
        :options="inputTypes"
        class="mr-1"
      />
    </div>
    <div class="px-5 my-2 items-center flex rounded text-sm bg-green-600">
      <button @click="addItemType">Add Type</button>
    </div>
  </div>
  <div class="mt-12 mb-8 flex text-2xl justify-between items-center w-full">
    <RouterLink
      to="/ledger/schema"
      class="px-4 py-2 text-lg transition-all rounded-full flex items-center font-medium"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 19.5L8.25 12l7.5-7.5"
        />
      </svg>

      Schema
    </RouterLink>
    <RouterLink
      v-if="itemTypes?.length"
      to="/ledger/form"
      class="px-4 py-2 text-lg bg-pink-600 hover:bg-pink-700 transition-all rounded-full flex items-center font-medium"
    >
      Add some data
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 ml-2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </RouterLink>
  </div>
</template>
