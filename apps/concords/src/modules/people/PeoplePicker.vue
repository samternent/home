<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";

defineProps({
  modelValue: String,
});
const emit = defineEmits(["update:modelValue"]);

const { ledger, getCollection } = useLedger();
const people = shallowRef<Array<IRecord>>([]);

const selected = shallowRef<any>(null);

watch(
  ledger,
  () => {
    people.value = getCollection("users")?.data;
  },
  { immediate: true }
);

function updateSelected() {
  const person = people.value.find(({ data }) => data?.id === selected.value);
  emit("update:modelValue", person?.data);
}
</script>

<template>
  <select @change="updateSelected" v-model="selected">
    <option v-for="item in people" :key="item.id" :value="item.data?.id">
      {{ item.data?.id }}
    </option>
  </select>
</template>
