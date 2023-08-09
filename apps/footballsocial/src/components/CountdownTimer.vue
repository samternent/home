<script setup>
import { shallowRef } from "vue";
import { DateTime } from "luxon";

const props = defineProps({
  kickOff: {
    type: String,
    required: true,
  },
});

const countdown = shallowRef(null);
setInterval(() => {
  countdown.value = DateTime.fromISO(props.kickOff).toRelative(DateTime.now());
}, 1 * 1000);
</script>
<template>
  <div
    v-if="countdown"
    class="uppercase text-center font-light bg-yellow-500 rounded text-black py-1 px-2 mx-2"
  >
    gameweek starts {{ countdown }}
  </div>
</template>
