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
      <thead>
        <th
          v-for="(column, i) in columns"
          :key="`header_${i}`"
          :style="`width: ${column.width}px`"
          class="uppercase p-2 font-light"
        >
          {{ column.name }}
        </th>
        <td class="uppercase p-2 font-light">Updated</td>
        <td class="uppercase p-2 font-light">User</td>
        <td class="uppercase p-2 font-light">Signature</td>
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
              v-bind="{ item: item?.data[column.name] }"
            ></component>
          </td>
          <td>
            <TextCell :item="formatTime(item?.timestamp)" />
          </td>
          <td>
            <IdentityAvatarCell :item="item.identity" />
          </td>
          <td>
            <VerifyRowCell v-bind="{ ...getVerifyProps(item) }" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
