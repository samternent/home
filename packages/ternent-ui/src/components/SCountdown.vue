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
      <span class="anton-regular text-lg lg:text-2xl">
        <span>{{ countdown?.days || 0 }}</span>
      </span>
      DAY
    </div>
    <div class="flex flex-col text-sm lg:text-base">
      <span class="anton-regular text-lg lg:text-2xl">
        <span>{{ countdown?.hours || 0 }}</span>
      </span>
      HOUR
    </div>
    <div class="flex flex-col text-sm lg:text-base">
      <span class="anton-regular text-lg lg:text-2xl">
        <span>{{ Math.floor(countdown?.minutes || 0) }}</span>
      </span>
      MIN
    </div>
    <div class="flex flex-col text-sm lg:text-base">
      <span class="anton-regular text-lg lg:text-2xl">
        <span>{{ Math.floor(countdown?.seconds || 0) }}</span>
      </span>
      SEC
    </div>
  </div>
</template>
