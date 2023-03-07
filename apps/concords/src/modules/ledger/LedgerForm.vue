<script lang="ts" setup>
import { shallowRef, watch, watchEffect } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "@concords/proof-of-work";
import { useToast } from "vue-toastification";

interface dynamicObject {
  [key: string]: string | number;
}
const { ledger, getCollection, addItem } = useLedger();
const toast = useToast();
const itemTypes = shallowRef<Array<IRecord>>([]);
const items = shallowRef<Array<IRecord>>([]);
const permission = shallowRef<string | null>();

const newItem = shallowRef<dynamicObject>({});

const props = defineProps({
  table: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["submit"]);

watch(
  ledger,
  () => {
    itemTypes.value = getCollection(`${props.table}:types`)?.data;
    items.value = getCollection(props.table)?.data;
  },
  { immediate: true }
);

watchEffect(() => {
  itemTypes.value = getCollection(`${props.table}:types`)?.data;
  items.value = getCollection(props.table)?.data;
});

function updateItem(e: Event, name: string) {
  const val = (e.target as HTMLTextAreaElement).value;
  newItem.value = { ...newItem.value, [name]: val };
}

async function addListItem() {
  await addItem({ ...newItem.value }, props.table, permission.value);
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
  emit("submit");
}
</script>

<template>
  <tr @keyup.enter="addListItem" class="sticky bottom-0 bg-zinc-900">
    <td
      v-for="itemType in itemTypes"
      :key="itemType.id"
      class="uppercase mx-auto w-full p-1"
    >
      <div class="bg-zinc-800 p-2">
        <input
          :key="newItem[itemType.data.name]"
          @change="updateItem($event, itemType.data.name)"
          :placeholder="itemType.data.name"
          :type="itemType.data.type"
          :value="newItem[itemType.data.name]"
          class="mx-auto w-full"
        />
      </div>
    </td>
    <td>
      <div class="p-2">
        <PermissionPicker v-model="permission" />
      </div>
    </td>

    <td colspan="3" class="p-2">
      <button
        @click="addListItem"
        class="bg-green-500 hover:bg-green-600 py-2 px-6 block w-full rounded text-sm"
      >
        Add
      </button>
    </td>
  </tr>
</template>
