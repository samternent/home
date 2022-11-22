<script setup>
import { inject } from "vue";
import LeagueTable from "../../components/LeagueTable.vue";
const competition = inject("competition");
</script>
<template>
  <LeagueTable class="w-full" :competitionCode="competition?.code" />
</template>
