<script lang="ts" setup>
import { shallowRef, watch, computed } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "@concords/proof-of-work";
import { useToast } from "vue-toastification";

interface dynamicObject {
  [key: string]: string | null;
}
const { ledger, getCollection, addItem } = useLedger();
const toast = useToast();
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
  text: {
    compnent: null,
  },
};
const columns = computed(() => {
  return (
    itemTypes.value?.map(({ data }) => ({
      ...data,
      ...(cellTypes[data.type] || {}),
    })) || []
  );
});
</script>

<template>
  <table class="text-left table-auto">
    <thead>
      <th
        v-for="(column, i) in columns"
        :key="`header_${i}`"
        :style="`width: ${column.width}px`"
      >
        {{ column.name }}
      </th>
    </thead>
    <tbody>
      <tr v-for="item in items" :key="item.id" class="my-2">
        <td v-for="(column, k) in columns" :key="`header_${item.id}${k}`">
          <!-- <component
            v-if="column.component"
            :is="column.component"
            v-bind="{ item: item[column.key] }"
          ></component>
          <span v-else>{{ item[column.key] }}</span> -->
          <span>{{ item[column.name] }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
