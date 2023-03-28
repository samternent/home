<script lang="ts" setup>
import { shallowRef, watch, watchEffect, computed, toRef } from "vue";
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
  () => !["users", "permissions"].includes(props.table) && !props.item
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
      <button
        @click="addListItem"
        class="bg-green-500 hover:bg-green-600 py-2 px-6 block w-full rounded text-sm"
      >
        {{ item ? "Add" : "Update" }}
      </button>
    </td>
  </tr>
</template>
