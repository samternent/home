<script setup>
import { inject } from "vue";
import DiscussionsList from "../../components/DiscussionsList.vue";
const competition = inject("competition");
</script>
<template>
  <DiscussionsList
    v-if="competition"
    class="w-full"
    :competitionCode="competition?.code"
  />
</template>
