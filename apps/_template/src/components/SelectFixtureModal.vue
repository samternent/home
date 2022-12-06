<script setup>
import { computed, toRefs, shallowRef } from "vue";
import Modal from "./Modal.vue";
import Spinner from "./Spinner.vue";
import useCompetitionFixturesLoader from "../api/football-data/useCompetitionFixturesLoader";
import useCompetitionTeamFixturesLoader from "../api/football-data/useCompetitionTeamFixturesLoader";
import FixturesList from "./FixturesList.vue";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  gameweek: {
    type: Number,
    default: null,
  },
  teamId: {
    type: Number,
    default: null,
  },
});

const { competitionCode, gameweek: currentGameweek, teamId } = toRefs(props);
const overrideGameweek = shallowRef();
const gameweek = computed(
  () => overrideGameweek.value || currentGameweek.value
);

const {
  items: fixtures,
  loading,
  loaded,
} = teamId.value
  ? useCompetitionTeamFixturesLoader(teamId)
  : useCompetitionFixturesLoader(competitionCode, gameweek);
const hasFixtures = computed(() => !loading.value && loaded.value);

function setGameweek(_gameweek) {
  overrideGameweek.value = _gameweek;
}
</script>
<template>
  <Modal @close="$emit('close')">
    <FixturesList
      :competitionCode="competitionCode"
      :currentGameweek="gameweek"
      @selected="(fixture) => $emit('selected', fixture)"
      size="sm"
    />
  </Modal>
</template>
