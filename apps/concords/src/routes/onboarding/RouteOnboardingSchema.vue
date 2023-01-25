<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useLedger } from "@/modules/ledger";

const router = useRouter();
const { ledger, getCollections, addItem } = useLedger();
const tables = shallowRef<Array<string>>([]);
const tableName = shallowRef<string>("");

function createTable() {
  router.push({
    path: `/ledger/schema/${tableName.value.split(" ").join("_")}`,
  });
}

watch(
  ledger,
  () => {
    tables.value = Object.keys(getCollections())
      .filter((col) => col.includes(":types"))
      .map((col) => col.split(":types")[0]);
  },
  { immediate: true }
);
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
      Woohoo! 👏 🎉
    </h1>
  </div>
  <div class="mt-4">
    <p class="my-3 text-2xl font-thin w-3/4 mx-auto mt-10">
      Well done! You've created your first Ledger. Now lets expore what we can
      do with it...
    </p>
  </div>

  <p class="my-3 text-2xl font-thin w-3/4 mx-auto mt-4">
    Create your first data table
  </p>
  <div class="my-3 text-xl font-thin w-3/4 mx-auto mt-2">
    <div class="flex items-center" @keyup.enter="createTable">
      <FormKit type="text" v-model="tableName" placeholder="Table Name" />
      <button
        class="px-4 py-2 mb-1 ml-2 bg-green-600 hover:bg-green-700 transition-all rounded flex font-medium"
        @click="createTable"
      >
        Create
      </button>
    </div>
  </div>

  <div
    class="text-lg font-thin mt-8 mb-8 py-4 rounded-xl bg-[#1a1a1a] px-6 w-3/4 mx-auto"
  >
    <ul class="flex flex-col my-6">
      <RouterLink
        as="li"
        :to="`/ledger/schema/${table}`"
        v-for="table in tables"
        :key="table"
        class="flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 mr-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
          />
        </svg>

        {{ table }}</RouterLink
      >
    </ul>
  </div>

  <div class="mt-12 mb-8 flex text-2xl justify-between items-center w-full">
    <RouterLink
      to="/encryption"
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

      Encryption
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
