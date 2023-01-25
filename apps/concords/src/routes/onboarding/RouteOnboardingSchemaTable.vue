<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useLedger } from "@/modules/ledger";
import { TableBuilder } from "@/modules/builder";
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
  <div class="flex items-center mt-16">
    <div
      class="w-6 h-6 md:w-10 md:h-10 lg:w-16 lg:h-16 relative mr-3 md:mr-4 lg:mr-8"
    >
      <svg
        class="fill-white w-6 h-6 md:w-10 md:h-10 lg:w-16 lg:h-16 mr-2 absolute top-1 left-1"
        viewBox="0 0 48 48"
      >
        <g>
          <path
            d="M5.899999237060548,-7.629394538355427e-7 c-5.6,0 -5.9,5.3 -5.9,5.6 v38.9 c19.9,0 35.2,0 38.6,0 c5.6,0 5.9,-5.3 5.9,-5.6 V-7.629394538355427e-7 H5.899999237060548 zM7.099999237060544,13.599999237060544 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3 z"
            id="svg_1"
            class=""
            fill="inherit"
            fill-opacity="1"
          />
        </g>
      </svg>
      <svg
        class="fill-pink-600 w-6 h-6 md:w-10 md:h-10 lg:w-16 lg:h-16 mr-2 absolute top-0 left-0"
        viewBox="0 0 48 48"
      >
        <g>
          <path
            d="M5.899999237060548,-7.629394538355427e-7 c-5.6,0 -5.9,5.3 -5.9,5.6 v38.9 c19.9,0 35.2,0 38.6,0 c5.6,0 5.9,-5.3 5.9,-5.6 V-7.629394538355427e-7 H5.899999237060548 zM7.099999237060544,13.599999237060544 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3,-2.1 c0,2.8 -2.8,5.1 -6.3,5.1 C9.99999923706055,18.699999237060545 7.099999237060544,16.39999923706055 7.099999237060544,13.599999237060544 zM32.49999923706055,30.599999237060544 c-1.5,0.9 -3.2,1.5 -5.1,2 c-1.6,0.4 -3.2,0.6000000000000001 -4.9,0.6000000000000001 c-2,0 -3.9,-0.30000000000000004 -5.8,-0.8 c-1.7000000000000002,-0.5 -3.3,-1.2 -4.7,-2 c-0.9,-0.6000000000000001 -1.1,-1.7000000000000002 -0.6000000000000001,-2.6 c0.6000000000000001,-0.9 1.7000000000000002,-1.1 2.6,-0.6000000000000001 c1.1,0.7000000000000001 2.3,1.2 3.7,1.6 c2.8,0.8 6,0.8 8.9,0.2 c1.5,-0.4 2.9,-0.9 4,-1.6 c0.9,-0.5 2,-0.2 2.6,0.6000000000000001 C33.699999237060545,28.89999923706055 33.39999923706055,30.099999237060544 32.49999923706055,30.599999237060544 zM31.89999923706055,18.699999237060545 c-3.5,0 -6.3,-2.3 -6.3,-5.1 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3,-2.1 C38.199999237060545,16.39999923706055 35.29999923706055,18.699999237060545 31.89999923706055,18.699999237060545 z"
            id="svg_1"
            class=""
            fill="inherit"
            fill-opacity="1"
          />
        </g>
      </svg>
    </div>
    <h1 class="text-2xl md:text-4xl lg:text-6xl font-light shadow-text">
      Create table
    </h1>
  </div>
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
