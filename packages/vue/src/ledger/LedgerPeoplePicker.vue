<script setup>
import { onMounted, shallowRef } from "vue";
import { useLedger } from "./";

const { getCollection } = useLedger();
const people = shallowRef();

onMounted(() => {
  people.value = getCollection("users").data.map((data) => data.identity);
});
</script>
<template>
  <!-- <v-autocomplete label="Autocomplete" :items="people"></v-autocomplete> -->
</template>
