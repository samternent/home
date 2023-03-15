<script lang="ts" setup>
import { shallowRef, watch, computed } from "vue";
import { useSorted, useLocalStorage } from "@vueuse/core";
import { DateTime } from "luxon";
import { useLedger } from "./useLedger";
import LedgerForm from "./LedgerForm.vue";
import { TextCell, VerifyRowCell, IdentityAvatarCell } from "@/modules/table";
import { useIdentity } from "@/modules/identity";
import type { IRecord } from "@concords/proof-of-work";

interface dynamicObject {
  [key: string]: string | null;
}
const { ledger, getCollection } = useLedger();
const { publicKeyPEM } = useIdentity();
const itemTypes = shallowRef<Array<IRecord>>([]);
const items = shallowRef<Array<IRecord>>([]);

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

const cellTypes: dynamicObject = {
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

function formatTime(time: number) {
  const date = DateTime.fromMillis(time);
  return date.toRelative(DateTime.DATETIME_MED);
}

function getVerifyProps(props: Object): Object {
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
</script>

<template>
  <div
    class="max-w-[100vw] md:max-w-[calc(100vw-66px)] overflow-auto flex-1 bg-zinc-900"
  >
    <table class="text-left table-auto w-full whitespace-nowrap text-white">
      <thead class="sticky top-0 bg-zinc-900 font-medium">
        <th
          v-for="(column, i) in columns"
          :key="`header_${i}`"
          :style="`width: ${column.width}px`"
          @click="sortBy = `data.${column.name}`"
          class="uppercase p-2 border-r-2 z-10 font-medium bg-indigo-700 text-zinc-50 border-indigo-800"
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
                'rotate-180': sortOrder === 'desc',
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
          class="uppercase p-2 border-r-2 z-10 font-medium bg-indigo-700 text-zinc-50 border-indigo-800"
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
                'rotate-180': sortOrder === 'desc',
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
          class="uppercase p-2 border-r-2 z-10 font-medium bg-indigo-700 text-zinc-50 border-indigo-800"
          @click="sortBy = 'permission'"
        >
          <div class="flex justify-between items-center">
            Permission
            <svg
              v-if="sortBy === 'permission'"
              @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4"
              :class="{
                'rotate-180': sortOrder === 'desc',
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
          class="uppercase p-2 z-20 font-medium bg-indigo-700 text-zinc-50"
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
                'rotate-180': sortOrder === 'desc',
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
      <tbody class="text-lg">
        <tr
          v-for="item in sortedItems"
          :key="item.id"
          tabindex="0"
          class="h-12 border-zinc-800 border-b-2"
        >
          <td
            v-for="(column, k) in columns"
            :key="`header_${item.id}${k}`"
            class="border-r-2 border-zinc-800"
          >
            <component
              :is="column.component"
              v-bind="{ item: item.data[column.name] }"
            ></component>
          </td>
          <td class="border-r-2 border-zinc-800">
            <TextCell :item="formatTime(item?.timestamp)" />
          </td>
          <td class="border-r-2 border-zinc-800">
            <div class="w-64 truncate p-2">
              {{
                item.data?.permission === publicKeyPEM
                  ? "YOUR EYES ONLY"
                  : item.data?.permission
              }}
            </div>
          </td>
          <td class="border-r-2 border-zinc-800">
            <IdentityAvatarCell :item="item.identity" />
          </td>
          <td class="border-r-2 border-zinc-800 px-2">
            <VerifyRowCell v-bind="{ ...getVerifyProps(item) }" />
          </td>
          <td class="px-2 text-zinc-700" v-if="canEdit">
            <!-- <VBtn icon variant="plain" size="small" class="mx-2"> -->
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
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
              />
            </svg>
            <!-- </VBtn> -->
          </td>
        </tr>
        <LedgerForm :table="table" :key="table" />
      </tbody>
    </table>
  </div>
</template>
