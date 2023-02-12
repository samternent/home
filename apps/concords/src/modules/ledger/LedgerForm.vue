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

const props = defineProps({
  table: {
    type: String,
    required: true,
  },
});

watch(
  ledger,
  () => {
    items.value = getCollection(props.table)?.data;
  },
  { immediate: true }
);

watchEffect(() => {
  itemTypes.value = getCollection(`${props.table}:types`)?.data;
  items.value = getCollection(props.table)?.data;
  permissions.value = getCollection("permissions")?.data;
});

function updateItem(e: Event, name: string) {
  const val = (e.target as HTMLTextAreaElement).value;
  newItem.value = { ...newItem.value, [name]: val };
}

async function addListItem() {
  await addItem({ ...newItem.value }, props.table, permission.value);
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
  </div>
</template>
