<script setup>
import { shallowRef, computed } from "vue";
import PredictionsResults from "@/module/predict/PredictionsResults.vue";
import { useCurrentUser } from "@/module/auth/useCurrentUser";
import { useCompetitionLoader } from "@/module/football-data/useCompetitionLoader";
import { getCompetitionGameweeks } from "@/utils/competitions";
import { SButton } from "ternent-ui/components";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});
const { user } = useCurrentUser();

const { items: competition } = useCompetitionLoader();

const overrideGameweek = shallowRef(
  competition.value?.currentSeason.currentMatchday
);

const season = computed(() => competition.value?.currentSeason.currentMatchday);
const gameweek = computed(
  () =>
    overrideGameweek.value || competition.value?.currentSeason.currentMatchday
);
const gameweeks = computed(() =>
  getCompetitionGameweeks(props.competitionCode)
);
</script>
<template>
  <div>
    <div class="flex justify-between py-2">
      <select
        v-model="overrideGameweek"
        aria-label="Gameweek"
        class="select select-bordered select-sm mr-4"
      >
        <option
          v-for="gw in gameweeks"
          :key="`gameweek_${competitionCode}_${gw}`"
          :value="gw"
        >
          Gameweek {{ gw }}
        </option>
      </select>
      <SButton
        @click="overrideGameweek = competition?.currentSeason.currentMatchday"
        class="btn-sm"
        type="secondary"
        >Current gameweek ({{
          competition?.currentSeason.currentMatchday
        }})</SButton
      >
    </div>
    <PredictionsResults
      :competitionCode="competitionCode"
      :private="!user"
      :gameweek="gameweek"
      :season="season"
      :key="gameweek"
    />
  </div>
</template>
