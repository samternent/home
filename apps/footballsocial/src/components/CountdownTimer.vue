<script setup>
import { shallowRef } from "vue";
import { DateTime } from "luxon";

const props = defineProps({
  kickOff: {
    type: String,
    required: true,
  },
  gameweek: {
    type: String,
    default: '',
  },
});

const countdown = shallowRef(null);
setInterval(() => {
  const inHours = DateTime.fromISO(props.kickOff).toFormat('hh');

  if (inHours > 12) {
    countdown.value = DateTime.fromISO(props.kickOff).toRelative(DateTime.now());
  } else {
    countdown.value = DateTime.fromISO(props.kickOff).toRelativeCalendar(DateTime.now());
  }
}, 1 * 1000);
</script>
<template>
  <div
    class="uppercase text-center font-light bg-indigo-700 rounded-t text-white py-2 px-2 mx-4"
  >
    gameweek {{ gameweek }} starts {{ countdown || '...' }}.
  </div>
</template>
