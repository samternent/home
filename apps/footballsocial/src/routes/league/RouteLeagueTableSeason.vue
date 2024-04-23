<script setup>
import PredictionsResults from "../../components/PredictionsResults.vue";
import { useCurrentUser } from "../../composables/useCurrentUser";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});
const { user } = useCurrentUser();
</script>
<template>
  <PredictionsResults :competitionCode="competitionCode" :private="!user" />
</template>
