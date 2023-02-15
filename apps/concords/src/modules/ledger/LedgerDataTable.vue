<script lang="ts" setup>
import { shallowRef, watch, computed } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import { TextCell } from "@/modules/table";
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
    items.value = [
      ...(getCollection(props.table)?.data?.map(({ data }) => data) || []),
    ];
  },
  { immediate: true }
);

const cellTypes: dynamicObject = {
  // text: {
  //   compnent: null,
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
</script>

<template>
  <table class="text-left table-auto w-full whitespace-nowrap">
    <thead>
      <th
        v-for="(column, i) in columns"
        :key="`header_${i}`"
        :style="`width: ${column.width}px`"
        class="uppercase p-2 font-light"
      >
        {{ column.name }}
      </th>
    </thead>
    <tbody>
      <tr
        v-for="item in items"
        :key="item.id"
        tabindex="0"
        class="focus:outline-none h-16 border-y border-[#3c3c3c]"
      >
        <td v-for="(column, k) in columns" :key="`header_${item.id}${k}`">
          <component
            :is="column.component"
            v-bind="{ item: item[column.name] }"
          ></component>
        </td>
      </tr>
    </tbody>
  </table>
</template>
