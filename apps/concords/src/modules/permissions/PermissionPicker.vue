<script lang="ts" setup>
import { shallowRef, watch, computed } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";

defineProps({
  modelValue: String,
});
const emit = defineEmits(["update:modelValue"]);

const { ledger, getCollection } = useLedger();
const permissions = shallowRef<Array<IRecord>>([]);

const selected = shallowRef<any>(null);

watch(
  ledger,
  () => {
    permissions.value = getCollection("permissions")?.data;
  },
  { immediate: true }
);

function updateSelected() {
  const permission = permissions.value.find(
    ({ data }) => data?.title === selected.value
  );
  emit("update:modelValue", permission?.data?.title);
}

const permissionTypes = computed(() => [
  ...new Set(permissions.value?.map(({ data }) => data?.title) || []),
]);
</script>

<template>
  <select @change="updateSelected" v-model="selected">
    <option v-for="item in permissionTypes" :key="item" :value="item">
      {{ item }}
    </option>
  </select>
</template>
