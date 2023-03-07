<script lang="ts" setup>
import { shallowRef, watch, computed } from "vue";
import { DateTime } from "luxon";
import { useLedger } from "./useLedger";
import LedgerForm from "./LedgerForm.vue";
import { TextCell, VerifyRowCell, IdentityAvatarCell } from "@/modules/table";
import type { IRecord } from "@concords/proof-of-work";

interface dynamicObject {
  [key: string]: string | null;
}
const { ledger, getCollection } = useLedger();
const itemTypes = shallowRef<Array<IRecord>>([]);
const items = shallowRef<Array<IRecord>>([]);

const props = defineProps({
  table: {
    type: String,
    required: true,
  },
});

defineEmits(["edit"]);

watch(
  [ledger, () => props.table],
  () => {
    itemTypes.value = getCollection(`${props.table}:types`)?.data;
    items.value = [...(getCollection(props.table)?.data || [])];
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
          class="uppercase p-2 border-r-2 z-10 font-medium bg-indigo-700 text-zinc-50 border-indigo-800"
        >
          {{ column.name }}
        </th>
        <td
          class="uppercase p-2 border-r-2 z-10 font-medium bg-indigo-700 text-zinc-50 border-indigo-800"
        >
          Updated
        </td>
        <td
          class="uppercase p-2 z-10 font-medium bg-indigo-700 text-zinc-50"
          colspan="3"
        >
          <div class="flex justify-end w-full">
            <button @click="$emit('edit')">
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
        </td>
      </thead>
      <tbody class="text-lg">
        <tr
          v-for="item in items"
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
              v-bind="{ item: item?.data[column.name] }"
            ></component>
          </td>
          <td class="border-r-2 border-zinc-800">
            <TextCell :item="formatTime(item?.timestamp)" />
          </td>
          <td class="border-r-2 border-zinc-800">
            <IdentityAvatarCell :item="item.identity" />
          </td>
          <td class="border-r-2 border-zinc-800">
            <VerifyRowCell v-bind="{ ...getVerifyProps(item) }" />
          </td>
          <td class="border-zinc-800 sticky right-0">
            <VBtn icon variant="plain" size="small" class="mx-2">
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
            </VBtn>
          </td>
        </tr>
        <LedgerForm :table="table" :key="table" />
      </tbody>
    </table>
  </div>
</template>
