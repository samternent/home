<script setup>
import { shallowRef, computed } from "vue";
import { DateTime, Interval } from "luxon";

const props = defineProps({
  kickOff: {
    type: String,
    required: true,
  },
  gameweek: {
    type: Number,
    required: true,
  },
  gameweek: {
    type: Number,
    required: true,
  },
  currentGameweek: {
    type: Number,
    required: true,
  },
});

</script>
<template>
  Gameweek {{ gameweek }}
  {{
    gameweek < currentGameweek
      ? "has finished"
      : showTimer
      ? `starts ${countdown || "..."} `
      : "has started"
  }}.
</template>
