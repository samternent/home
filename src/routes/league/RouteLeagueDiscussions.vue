<script setup>
import { inject } from "vue";
import DiscussionsList from "../../components/DiscussionsList.vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
const { items: competition, hasItems: hasCompetition } = useCompetitionLoader();
</script>
<template>
  <DiscussionsList
    v-if="competition"
    class="w-full"
    :competitionCode="competition?.code"
  />
</template>
