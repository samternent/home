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

watch(
  selected,
  (_selected) => {
    const permission = permissions.value.find(
      ({ data }) => data?.title === _selected
    );
    emit("update:modelValue", permission?.data?.title);
  },
  { immediate: true }
);

const permissionTypes = computed(() => [
  ...new Set(permissions.value?.map(({ data }) => data?.title) || []),
]);
</script>

<template>
  <FormKit
    type="select"
    label="Add a permission"
    name="permission"
    placeholder="Select a permission"
    v-model="selected"
    :options="permissionTypes"
  />
</template>
