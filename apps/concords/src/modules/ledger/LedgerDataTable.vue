<script lang="ts" setup>
import { shallowRef, watch, watchEffect } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "@concords/proof-of-work";
import { useToast } from "vue-toastification";
import { LayoutHeaderTitle } from "@/modules/layout";

interface dynamicObject {
  [key: string]: string | number;
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
  ledger,
  () => {
    itemTypes.value = getCollection(`${props.table}:types`)?.data;
    items.value = [...(getCollection(props.table)?.data || [])];
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex w-full flex-1 pt-8">
    <table class="border-2 border-[#3c3c3c] w-full rounded-lg">
      <thead>
        <tr>
          <th
            v-for="itemType in itemTypes"
            :key="`header_${itemType.id}`"
            class="px-5 py-3 border-b-2 border-[#3c3c3c] text-left text-xs font-semibold uppercase tracking-wider"
          >
            {{ itemType?.data?.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="item in items" :key="item.id">
          <tr v-if="!item.data?.encrypted">
            <td
              class="px-5 py-1 border-b border-[#3c3c3c] text-sm"
              v-for="itemType in itemTypes"
              :key="`${item.id}_${itemType.id}`"
            >
              {{ item.data[itemType.data?.name] }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
