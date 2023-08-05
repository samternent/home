<script lang="ts" setup>
import { shallowRef, watch, watchEffect, computed, toRef } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "concords-proof-of-work";
import { useToast } from "vue-toastification";

interface dynamicObject {
  [key: string]: string | number;
}
const { ledger, getCollection, addItem } = useLedger();
const toast = useToast();
const itemTypes = shallowRef<Array<IRecord>>([]);
const items = shallowRef<Array<IRecord>>([]);
const permission = shallowRef<string | null>();

const props = defineProps({
  table: {
    type: String,
    required: true,
  },
  item: {
    type: Object,
    default: {},
  },
});

const newItem = shallowRef(props.item?.data || {});

const emit = defineEmits(["submit"]);

watch(
  ledger,
  () => {
    if (props.table === "users") {
      itemTypes.value = [
        {
          data: {
            name: "username",
            type: "text",
          },
        },
        {
          data: {
            name: "encryption",
            type: "text",
          },
        },
        {
          data: {
            name: "identity",
            type: "text",
          },
        },
      ];
      items.value = [...(getCollection(props.table)?.data || [])];
    } else if (props.table === "permissions") {
      itemTypes.value = [
        {
          data: {
            name: "title",
            type: "text",
          },
        },
        {
          data: {
            name: "identity",
            type: "text",
          },
        },
      ];
      items.value = [...(getCollection(props.table)?.data || [])];
    } else {
      itemTypes.value = getCollection(`${props.table}:types`)?.data;
      items.value = [...(getCollection(props.table)?.data || [])];
    }
  },
  { immediate: true }
);

watchEffect(() => {
  if (props.table === "users") {
    itemTypes.value = [
      {
        data: {
          name: "username",
          type: "text",
        },
      },
      {
        data: {
          name: "encryption",
          type: "text",
        },
      },
      {
        data: {
          name: "identity",
          type: "text",
        },
      },
    ];
    items.value = [...(getCollection(props.table)?.data || [])];
  } else if (props.table === "permissions") {
    itemTypes.value = [
      {
        data: {
          name: "title",
          type: "text",
        },
      },
      {
        data: {
          name: "identity",
          type: "text",
        },
      },
    ];
    items.value = [...(getCollection(props.table)?.data || [])];
  } else {
    itemTypes.value = getCollection(`${props.table}:types`)?.data;
    items.value = [...(getCollection(props.table)?.data || [])];
  }
});

function updateItem(e: Event, name: string, item) {
  const val = item ? item.id : (e.target as HTMLTextAreaElement).value;
  newItem.value = { ...newItem.value, [name]: val };
}

const allowPermission = computed(
  () =>
    !["users", "permissions"].includes(props.table) &&
    !Object.keys(props.item).length
);

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

function getItems(type: string, name: string) {
  const table = type.split(":types")[0];

  if (!table) {
    return [];
  }

  const items = getCollection(table)?.data;
  return items.reduce((acc: Array<string>, item: IRecord) => {
    if (!item.data) return acc;
    return [...acc, item.data];
  }, []);
}

function getValue(type: string, name: string, id: string) {
  return getCollection(type.split(":types")[0])?.findOne({ "data.id": id })
    ?.data[name.split(":")[1]];
}
</script>

<template>
  <tr @keyup.enter="addListItem" class="sticky bottom-0 bg-zinc-900">
    <td
      v-for="itemType in itemTypes"
      :key="itemType.id"
      class="uppercase mx-auto w-full p-1"
    >
      <div v-if="itemType.data?.type.includes(':type')">
        <VSelect
          @change="updateItem($event, itemType.data?.name)"
          :items="getItems(itemType.data.type, itemType.data.name)"
          class="w-64"
          density="comfortable"
          variant="outlined"
          theme="dark"
          :value="
            getValue(
              itemType.data.type,
              itemType.data.name,
              newItem[itemType.data.name]
            )
          "
          rounded
          :hide-details="true"
          placeholder="Select"
          :menu-props="{
            closeOnContentClick: true,
          }"
        >
          <template #selection="{ item: { raw: item } }">
            <div class="flex items-center">item</div>
          </template>

          <template #item="{ item: { raw: item } }">
            <VSheet>
              <VListItem
                density="compact"
                @click="updateItem($event, itemType.data?.name, item)"
              >
                {{ item[itemType.data?.name.split(":")[1]] }}
              </VListItem></VSheet
            >
          </template>
        </VSelect>
      </div>
      <div v-else class="bg-zinc-800 p-2 w-full min-w-64">
        <input
          :key="newItem[itemType.data?.name]"
          @change="updateItem($event, itemType.data?.name)"
          :placeholder="itemType.data?.name"
          :type="itemType.data?.type"
          :value="newItem[itemType.data?.name]"
          class="mx-auto w-full"
        />
      </div>
    </td>
    <td></td>
    <td>
      <div class="p-2" v-if="allowPermission">
        <PermissionPicker v-model="permission" />
      </div>
    </td>

    <td colspan="3" class="p-2">
      <div
        v-if="!Object.keys(item).length"
        class="flex justify-end items-center"
      >
        <VBtn
          class="w-full max-w-32"
          variant="tonal"
          @click="addListItem"
          color="success"
          :disabled="!Object.keys(newItem).length"
        >
          Add
        </VBtn>
      </div>
      <div v-else class="flex justify-end items-center">
        <VBtn
          icon
          size="x-small"
          variant="tonal"
          @click="addListItem"
          color="success"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </VBtn>
        <VBtn icon variant="plain" @click="$emit('close')" color="error"
          ><svg
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </VBtn>
      </div>
    </td>
  </tr>
</template>
