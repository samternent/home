<script setup>
import { toRefs, computed } from "vue";
import useTableLoader from "../api/football-data/useCompetitionTableLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const { competitionCode } = toRefs(props);

const {
  items: table,
  loading: tableLoading,
  loaded: tableLoaded,
} = useTableLoader(competitionCode);

const hasTable = computed(() => !tableLoading.value && tableLoaded.value);
const tableData = computed(() =>
  table.value?.standings?.length ? table.value?.standings[0]?.table : null
);
</script>
<template>{{ table }}</template>
<style></style>
