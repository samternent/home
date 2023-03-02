<script lang="ts" setup>
import { shallowRef, watch, computed } from "vue";
import { DateTime } from "luxon";
import { useLedger } from "@/modules/ledger";
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
  <div class="max-w-screen overflow-x-auto">
    <table class="text-left table-auto w-full whitespace-nowrap">
      <thead class="sticky top-0 bg-white">
        <th
          v-for="(column, i) in columns"
          :key="`header_${i}`"
          :style="`width: ${column.width}px`"
          class="uppercase p-2 font-light border-x z-10 border-zinc-300"
        >
          {{ column.name }}
        </th>
        <td class="uppercase p-2 font-light border-x z-10 border-zinc-300">
          Updated
        </td>
        <td class="uppercase p-2 font-light border-x z-10 border-zinc-300">
          User
        </td>
        <td class="uppercase p-2 font-light border-x z-10 border-zinc-300"></td>
        <td class="uppercase p-2 font-light border-x z-10 border-zinc-300"></td>
      </thead>
      <tbody class="text-sm">
        <tr v-for="item in items" :key="item.id" tabindex="0" class="h-12">
          <td
            v-for="(column, k) in columns"
            :key="`header_${item.id}${k}`"
            class="border border-zinc-200"
          >
            <component
              :is="column.component"
              v-bind="{ item: item?.data[column.name] }"
            ></component>
          </td>
          <td class="border border-zinc-200">
            <TextCell :item="formatTime(item?.timestamp)" />
          </td>
          <td class="border border-zinc-200">
            <IdentityAvatarCell :item="item.identity" />
          </td>
          <td class="border border-zinc-200">
            <VerifyRowCell v-bind="{ ...getVerifyProps(item) }" />
          </td>
          <td class="border border-zinc-200">
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
      </tbody>
    </table>
  </div>
</template>
