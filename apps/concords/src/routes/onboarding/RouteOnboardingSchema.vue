<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useLedger } from "@/modules/ledger";
import { LayoutHeaderTitle } from "@/modules/layout";

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
  <LayoutHeaderTitle title="Woohoo! 👏 🎉" />
  <div class="mt-4">
    <p class="my-3 text-2xl font-thin w-full max-w-5xl mx-auto mt-10">
      Well done! You've created your first Ledger. Now lets expore what we can
      do with it...
    </p>
  </div>

  <p class="my-3 text-2xl font-thin w-full max-w-5xl mx-auto mt-4">
    Create your first data table
  </p>
  <div class="my-3 text-xl font-thin w-full max-w-5xl mx-auto mt-2">
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
    class="text-lg font-thin mt-8 mb-8 py-4 rounded-xl bg-[#1a1a1a] px-6 w-full max-w-5xl mx-auto"
  >
    <ul class="flex flex-col my-6" v-if="tables.length">
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
    <div v-else>No tables yet</div>
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
      v-if="tables.length"
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
