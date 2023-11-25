<script setup>
import { shallowRef, onBeforeUnmount } from "vue";
import { Interval, DateTime } from "luxon";

const props = defineProps({ time: { type: String, default: undefined } });
const countdown = shallowRef(null);

let timerInterval = setInterval(() => {
  countdown.value = Interval.fromDateTimes(
    DateTime.now(),
    DateTime.fromISO(props.time)
  )
    .toDuration(["days", "hours", "minutes", "seconds"])
    .toObject();
}, 1 * 1000);

onBeforeUnmount(() => {
  clearInterval(timerInterval);
});
</script>
<template>
  <div class="grid grid-flow-col gap-5 text-center auto-cols-max">
    <div class="flex flex-col text-sm lg:text-base">
      <span class="font-mono text-lg lg:text-2xl">
        <span>{{ countdown?.days || 0 }}</span>
      </span>
      day
    </div>
    <div class="flex flex-col text-sm lg:text-base">
      <span class="font-mono text-lg lg:text-2xl">
        <span>{{ countdown?.hours || 0 }}</span>
      </span>
      hour
    </div>
    <div class="flex flex-col text-sm lg:text-base">
      <span class="font-mono text-lg lg:text-2xl">
        <span>{{ Math.floor(countdown?.minutes || 0) }}</span>
      </span>
      min
    </div>
    <div class="flex flex-col text-sm lg:text-base">
      <span class="font-mono text-lg lg:text-2xl">
        <span>{{ Math.floor(countdown?.seconds || 0) }}</span>
      </span>
      sec
    </div>
  </div>
</template>
