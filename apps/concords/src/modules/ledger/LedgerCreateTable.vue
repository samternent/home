<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { LayoutHeaderTitle } from "@/modules/layout";
import type { IRecord } from "@concords/proof-of-work";
import inputTypes from "@/utils/inputTypes";
import { useCollection } from "@/modules/ledger";

const props = defineProps({
  tableName: {
    type: String,
    required: true,
  },
});

const { ledger, getCollection, addItem } = useLedger();
const { items } = useCollection(`${props.tableName}:types`);

const type = shallowRef<string>("text");
const name = shallowRef<string>("");
const itemTypes = shallowRef<Array<IRecord>>([]);

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
      <tr v-for="item in items" :key="item.id">
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
</template>
