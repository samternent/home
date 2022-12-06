<script setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";

const people = shallowRef([]);

const { getCollection, ledger } = useLedger();

watch(
  ledger,
  () => {
    people.value = getCollection("users")?.data;
  },
  { immediate: true }
);
</script>
<template>
  <VList density="compact">
    <VListItem v-for="person in people" :key="person.identity">{{
      person.identity
    }}</VListItem>
  </VList>
</template>
