<script lang="ts" setup>
import { shallowRef, watch, watchEffect } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "@concords/proof-of-work";
import { useToast } from "vue-toastification";

interface dynamicObject {
  [key: string]: string | number;
}
const { ledger, getCollections, getCollection, addItem } = useLedger();
const toast = useToast();
const itemTypes = shallowRef<Array<IRecord>>([]);
const items = shallowRef<Array<IRecord>>([]);
const permissions = shallowRef<Array<IRecord>>([]);
const permission = shallowRef<string | null>();

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
  permissions.value = getCollection("permissions")?.data;
});

function updateItem(e: Event, name: string) {
  const val = (e.target as HTMLTextAreaElement).value;
  newItem.value = { ...newItem.value, [name]: val };
}

async function addListItem() {
  await addItem({ ...newItem.value }, activeFormName.value, permission.value);
  newItem.value = {};
  toast.success("Item added", {
    position: "bottom-right",
    timeout: 1000,
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
      Form
    </h1>
  </div>
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
      <PermissionPicker v-model="permission" />
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
          <template v-for="item in items" :key="item.id">
            <tr v-if="!item.data?.encrypted">
              <td
                class="px-5 py-1 border-b border-[#3c3c3c] text-sm"
                v-for="itemType in itemTypes"
                :key="`${item.id}_${itemType.id}`"
              >
                {{ item.data[itemType.data?.name] }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
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
      v-if="!permissions?.length"
      to="/ledger/permissions"
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
    <RouterLink
      v-else
      to="/ledger/impersonate"
      class="px-4 py-2 text-lg bg-pink-600 hover:bg-pink-700 transition-all rounded-full flex items-center font-medium"
    >
      Impersonate
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
