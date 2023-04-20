<script setup>
import { computed } from "vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: null,
  },
});
const { items: competition } = useCompetitionLoader();
const tabs = computed(() => [
  {
    title: `Gameweek ${competition.value?.currentSeason?.currentMatchday + 1}`,
    to: "play",
  },
  { title: "Results", to: "results" },
  { title: "Table", to: "table" },
]);
</script>
<template>
  <div class="mx-auto">
    <ul class="flex my-4">
      <li v-for="t in tabs" :key="`${t}`">
        <RouterLink
          :to="`/leagues/${competition?.code}/predictions/${t.to}`"
          class="px-4 py-2 text-sm uppercase hover:dark:bg-zinc800 hover:border-indigo-800 dark:text-white border-b-4 border-transparent"
          active-class="!border-indigo-800 dark:bg-zinc800 "
        >
          {{ t.title }}
        </RouterLink>
      </li>
    </ul>

    <RouterView />
  </div>
</template>
