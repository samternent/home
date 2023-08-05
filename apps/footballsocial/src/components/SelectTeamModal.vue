<script setup>
import { computed, toRefs } from "vue";
import Modal from "../components/Modal.vue";
import Spinner from "../components/Spinner.vue";
import useCompetitionTeamsLoader from "../api/football-data/useCompetitionTeamsLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const { competitionCode } = toRefs(props);

const {
  items: competition,
  loading: competitionLoading,
  loaded: competitionLoaded,
} = useCompetitionTeamsLoader(competitionCode);

const hasCompetition = computed(
  () => !competitionLoading.value && competitionLoaded.value
);

const teams = computed(
  () =>
    competition.value?.teams.sort((a, b) => a.name.localeCompare(b.name)) || []
);
</script>
<template>
  <Modal @close="$emit('close')">
    <div v-if="hasCompetition" class="grid grid-cols-4 gap-2">
      <div
        v-for="team in teams"
        :key="team.id"
        @click="$emit('selected', team)"
        class="flex items-center justify-between p-2 flex-col hover:dark:bg-[#2d2d2d] z-10 rounded border-2 border-transparent hover:border-[#4e4e4e] cursor-pointer"
      >
        <div class="px-1 md:px-2 lg:px-4">
          <img :alt="team.name" :src="team.crest" class="w-full" />
        </div>
        <span class="truncate text-base dark:text-white mt-3 w-full text-center"
          >{{ team.shortName }}
        </span>
      </div>
    </div>
    <div
      v-else
      class="flex-1 flex relative justify-center items-center h-64 w-full"
    >
      <Spinner />
    </div>
  </Modal>
</template>
