<script setup>
import { shallowRef, computed } from "vue";
import { DateTime, Interval } from "luxon";

const props = defineProps({
  kickOff: {
    type: String,
    required: true,
  },
  gameweek: {
    type: String,
    default: "",
  },
});

const countdown = shallowRef(null);
setInterval(() => {
  const inHours = DateTime.fromISO(props.kickOff).toFormat("hh");

  if (inHours > 12) {
    countdown.value = DateTime.fromISO(props.kickOff).toRelative(
      DateTime.now()
    );
  } else {
    countdown.value = DateTime.fromISO(props.kickOff).toRelativeCalendar(
      DateTime.now()
    );
  }
}, 1 * 1000);

const showTimer = computed(() => {
  const timeDiff = Interval.fromDateTimes(
    DateTime.now(),
    DateTime.fromISO(props.kickOff)
  ).length();
  if (isNaN(timeDiff)) {
    return false;
  }
  return timeDiff > 1;
});
</script>
<template>
  gameweek {{ gameweek }}
  {{ showTimer ? `starts ${countdown || "..."} ` : "has started" }}.
</template>
