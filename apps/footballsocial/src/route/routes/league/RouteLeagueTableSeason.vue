<script setup>
import PredictionsResults from "@/module/predict/PredictionsResults.vue";
import { useCurrentUser } from "@/module/auth/useCurrentUser";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  season: {
    type: String,
    required: true,
  },
});
const { user } = useCurrentUser();
</script>
<template>
  <PredictionsResults
    :competitionCode="competitionCode"
    :private="!user"
    :season="season"
  />
</template>
