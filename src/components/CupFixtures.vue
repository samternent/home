<script setup>
import { shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import FixturesList from "./FixturesList.vue";

defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  currentGameweek: {
    type: Number,
    default: null,
  },
});
const tabs = shallowRef([
  "Groups",
  "Last 16",
  "Quarters",
  "Semis",
  "Playoffs",
  "Final",
]);

const activeStage = useLocalStorage("activeGroupSelection", "Groups");
</script>
<template>
  <div>
    <ul class="flex my-4 text-sm px-2">
      <li v-for="t in tabs" :key="`${t}`">
        <button
          @click="activeStage = t"
          class="px-2 py-1 hover:border-indigo-800 text-white border-b-2 border-transparent"
          :class="{
            'border-indigo-900': activeStage === t,
          }"
        >
          {{ t }}
        </button>
      </li>
    </ul>
    <FixturesList
      v-if="activeStage === 'Groups'"
      :competitionCode="competitionCode"
      :currentGameweek="currentGameweek"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competitionCode}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
    <FixturesList
      v-if="activeStage === 'Last 16'"
      :competitionCode="competitionCode"
      stage="LAST_16"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competitionCode}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
    <FixturesList
      v-if="activeStage === 'Quarters'"
      :competitionCode="competitionCode"
      stage="QUARTER_FINALS"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competitionCode}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
    <FixturesList
      v-if="activeStage === 'Semis'"
      :competitionCode="competitionCode"
      stage="SEMI_FINALS"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competitionCode}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
    <FixturesList
      v-if="activeStage === 'Playoffs'"
      :competitionCode="competitionCode"
      stage="THIRD_PLACE"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competitionCode}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
    <FixturesList
      v-if="activeStage === 'Final'"
      :competitionCode="competitionCode"
      stage="FINAL"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competitionCode}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
  </div>
</template>
