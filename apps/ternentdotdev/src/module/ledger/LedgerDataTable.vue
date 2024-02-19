<script setup>
import { shallowRef, watch, computed } from "vue";
import { useSorted, useLocalStorage } from "@vueuse/core";
import { DateTime } from "luxon";
import { useLedger } from "./useLedger";
import { useIdentity } from "../identity/useIdentity";
import IdentityAvatar from "../identity/IdentityAvatar.vue";
import VerifyRowCell from "../table/VerifyRowCell.vue";
import TextCell from "../table/TextCell.vue";
import LedgerDataTableInsertRow from "./LedgerDataTableInsertRow.vue";

const { ledger, getCollection } = useLedger();
const { publicKeyPEM } = useIdentity();
const itemTypes = shallowRef([]);
const items = shallowRef([]);

const props = defineProps({
  table: {
    type: String,
    required: true,
  },
});

defineEmits(["edit"]);

const canEdit = computed(() => !["users", "permissions"].includes(props.table));
watch(
  [ledger, () => props.table],
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
    } else if (props.table === "tasks") {
      itemTypes.value = [
        {
          data: {
            name: "name",
            type: "text",
          },
        },
        {
          data: {
            name: "completed",
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
            name: "public",
            type: "text",
          },
        },
        {
          data: {
            name: "identity",
            type: "text",
          },
        },
        {
          data: {
            name: "secret",
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

const cellTypes = {
  // text: {
  //   component: null,
  // },
};
const columns = computed(() => {
  return (
    itemTypes.value?.map(({ data }) => ({
      ...data,
      ...(cellTypes[data.type] || { component: TextCell }),
    })) || []
  );
});

function formatTime(time) {
  const date = DateTime.fromMillis(time);
  return date.toRelative(DateTime.DATETIME_MED);
}

function getVerifyProps(props) {
  return [
    "collection",
    "id",
    "timestamp",
    "data",
    "signature",
    "identity",
  ].reduce((obj, key) => ({ ...obj, [key]: props[key] }), {});
}

const sortBy = useLocalStorage("ledgerTableSortBy", "timestamp");
const sortOrder = useLocalStorage("ledgerTableSortOrder", "asc");
const sortedItems = computed(
  () =>
    useSorted(items.value, (a, b) => {
      if (sortBy.value === "timestamp") {
        if (sortOrder.value === "asc") {
          return a.timestamp - b.timestamp;
        }
        if (sortOrder.value === "desc") {
          return b.timestamp - a.timestamp;
        }
      }
      if (sortBy.value === "identity") {
        if (sortOrder.value === "asc") {
          return ("" + a.identity).localeCompare(b.identity);
        }
        if (sortOrder.value === "desc") {
          return ("" + b.identity).localeCompare(a.identity);
        }
      }
      if (sortBy.value.startsWith("data.")) {
        if (sortOrder.value === "asc") {
          return ("" + a.data[sortBy.value.split("data.")[1]]).localeCompare(
            b.data[sortBy.value.split("data.")[1]]
          );
        }
        if (sortOrder.value === "desc") {
          return ("" + b.data[sortBy.value.split("data.")[1]]).localeCompare(
            a.data[sortBy.value.split("data.")[1]]
          );
        }
      }
    }).value
);

function getValue(type, name, id) {
  return getCollection(type.split(":type")[0])?.findOne({ "data.id": id })
    ?.data[name.split(":")[1]];
}

const editItem = shallowRef(null);
</script>

<template>
  <table
    class="text-left table-auto w-full whitespace-nowrap border-separate text-sm"
  >
    <thead class="sticky top-[0.2em] bg-base-200">
      <th
        class="uppercase p-2 z-10 bg-base-300 border-base-200 border font-thin"
      >
        id
      </th>
      <th
        v-for="(column, i) in columns"
        :key="`header_${i}`"
        :style="`width: ${column.width}px`"
        @click="sortBy = `data.${column.name}`"
        class="uppercase p-2 z-10 bg-base-300 border-base-200 border font-thin"
      >
        <div class="flex justify-between items-center">
          {{ column.name }}
          <svg
            v-if="sortBy === `data.${column.name}`"
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
            :class="{
              'rotate-180': sortOrder === 'asc',
            }"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
            />
          </svg>
        </div>
      </th>
      <th
        class="uppercase p-2 z-10 bg-base-300 border-base-200 border font-thin"
        @click="sortBy = 'timestamp'"
      >
        <div class="flex justify-between items-center">
          Updated
          <svg
            v-if="sortBy === 'timestamp'"
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
            :class="{
              'rotate-180': sortOrder === 'asc',
            }"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
            />
          </svg>
        </div>
      </th>
      <th
        class="uppercase p-2 z-10 bg-base-300 border-base-200 border font-thin"
        @click="sortBy = 'data.permission'"
      >
        <div class="flex justify-between items-center">
          Permission
          <svg
            v-if="sortBy === 'data.permission'"
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
            :class="{
              'rotate-180': sortOrder === 'asc',
            }"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
            />
          </svg>
        </div>
      </th>
      <th
        class="uppercase p-2 z-20 bg-base-300 border-base-200 border font-thin"
        :colspan="canEdit ? 3 : 2"
        @click="sortBy = 'identity'"
      >
        <div class="flex justify-between items-center">
          <svg
            v-if="sortBy === 'identity'"
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
            :class="{
              'rotate-180': sortOrder === 'asc',
            }"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
            />
          </svg>
          <div class="flex justify-end w-full">
            <button @click="$emit('edit')" v-if="canEdit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
              </svg>
            </button>
          </div>
        </div>
      </th>
    </thead>
    <tbody class="">
      <template v-for="item in sortedItems" :key="item.id">
        <tr tabindex="0" class="h-12 border-base-300 border-b border-l">
          <td class="border-r border-base-300 border-b truncate w-20">
            {{ item.data.id }}
          </td>
          <td
            v-for="(column, k) in columns"
            :key="`header_${item.id}${k}`"
            class="border-r border-base-300 border-b"
          >
            <div v-if="column.type.includes(':types')">
              {{ getValue(column.type, column.name, item.data[column.name]) }}
            </div>
            <component
              v-else
              :is="column.component"
              v-bind="{ item: item.data[column.name] }"
            ></component>
          </td>
          <td class="border-r border-base-300 border-b">
            <TextCell :item="formatTime(item?.timestamp)" />
          </td>
          <td class="border-r border-base-300 border-b">
            <div class="w-64 truncate p-2 flex">
              <IdentityAvatar
                v-if="item.data?.permission?.startsWith('MFkw')"
                :identity="item.data?.permission"
              />
              {{
                item.data?.permission === publicKeyPEM
                  ? "(you)"
                  : item.data?.permission
              }}
            </div>
          </td>
          <td class="text-center border-base-300 border-b">
            <IdentityAvatar :identity="item.identity" />
          </td>
          <td class="text-center border-base-300 border-b">
            <VerifyRowCell v-bind="{ ...getVerifyProps(item) }" />
          </td>
          <td class="px-2 border-r border-base-300 border-b" v-if="canEdit">
            <button
              icon
              variant="plain"
              size="small"
              color="white"
              class="mx-2"
              @click="editItem = item.id"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
              </svg>
            </button>
          </td>
        </tr>
      </template>
      <div v-if="table === 'permissions'"></div>
      <LedgerDataTableInsertRow :table="table" :key="table" />
    </tbody>
  </table>
</template>
