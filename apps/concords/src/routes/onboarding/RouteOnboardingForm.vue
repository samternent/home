<script lang="ts" setup>
import { shallowRef, watch, watchEffect } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";
import { useToast } from "vue-toastification";

interface dynamicObject {
  [key: string]: string | number;
}
const { ledger, getCollections, getCollection, addItem } = useLedger();
const toast = useToast();
const itemTypes = shallowRef<Array<IRecord>>([]);
const items = shallowRef<Array<IRecord>>([]);

const newItem = shallowRef<dynamicObject>({});

const forms = shallowRef();
const activeFormName = shallowRef();

watch(
  ledger,
  () => {
    forms.value = Object.keys(getCollections())
      .filter((col) => col.includes(":types"))
      .map((col) => col.split(":types")[0]);
    if (!activeFormName.value) {
      activeFormName.value = forms.value[0];
    }
    items.value = getCollection(activeFormName.value)?.data;
  },
  { immediate: true }
);

watchEffect(() => {
  itemTypes.value = getCollection(`${activeFormName.value}:types`)?.data;
  items.value = getCollection(activeFormName.value)?.data;
});

function updateItem(e: Event, name: string) {
  const val = (e.target as HTMLTextAreaElement).value;
  newItem.value = { ...newItem.value, [name]: val };
}

async function addListItem() {
  await addItem({ ...newItem.value }, activeFormName.value);
  newItem.value = {};
  toast.success("Item added", {
    position: "bottom-right",
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: false,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: true,
    hideProgressBar: true,
    closeButton: "button",
    icon: true,
    rtl: false,
  });
  newItem.value = {};
}
</script>

<template>
  <div class="flex justify-end items-center">
    <span class="text-2xl mr-4 font-thin">select a form 👉</span>
    <FormKit type="select" v-model="activeFormName" :options="forms" />
  </div>

  <div class="flex w-full flex-1 pt-8">
    <div @keyup.enter="addListItem" class="w-1/2">
      <div
        v-for="itemType in itemTypes"
        :key="itemType.id"
        class="my-3 uppercase"
      >
        <FormKit
          :label="itemType.data.name"
          @change="updateItem($event, itemType.data.name)"
          :placeholder="itemType.data.name"
          :type="itemType.data.type"
          :value="newItem[itemType.data.name]"
          class="mx-auto"
        />
      </div>
      <div class="w-full flex justify-end max-w-md">
        <button
          @click="addListItem"
          class="px-8 py-2 my-8 text-center text-lg bg-green-600 hover:bg-green-700 transition-all rounded-full flex items-center font-medium"
        >
          Add
        </button>
      </div>
    </div>
    <div class="my-6 w-1/2">
      <table class="border-2 border-[#3c3c3c] w-full rounded-lg">
        <thead>
          <tr>
            <th
              v-for="itemType in itemTypes"
              :key="`header_${itemType.id}`"
              class="px-5 py-3 border-b-2 border-[#3c3c3c] text-left text-xs font-semibold uppercase tracking-wider"
            >
              {{ itemType?.data?.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td
              class="px-5 py-1 border-b border-[#3c3c3c] text-sm"
              v-for="itemType in itemTypes"
              :key="`${item.id}_${itemType.id}`"
            >
              {{ item.data[itemType.data.name] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="mt-12 mb-8 flex text-2xl justify-between items-center w-full">
    <RouterLink
      to="/welcome/ledger/schema"
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
      to="/welcome/ledger/permissions"
      class="px-4 py-2 text-lg bg-pink-600 hover:bg-pink-700 transition-all rounded-full flex items-center font-medium"
    >
      Permissions
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
