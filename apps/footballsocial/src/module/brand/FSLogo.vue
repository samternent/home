<script setup>
import { useWhiteLabel } from "./useWhiteLabel";

const { isWhiteLabel, host, colorTheme } = useWhiteLabel();
</script>
<template>
  <div class="flex mx-2 group h-full" v-if="!isWhiteLabel">
    <div
      class="flex flex-col justify-center -translate-x-6 lg:-translate-x-12 anton-regular"
    >
      <div
        class="bg-base-content text-base-100 text-[24.3px] md:text-[30.7px] lg:text-[43.9px] [transform:rotate(-90deg)translate(0px,0px)] md:[transform:rotate(-90deg)translate(0px,0px)] lg:[transform:rotate(-90deg)translate(0px,24px)] px-2 uppercase"
      >
        Social
      </div>
    </div>
    <div
      class="font-bold text-base-content text-[78px] md:text-[96px] lg:text-[136px] uppercase anton-regular [transform:translateX(-40px)] md:[transform:translateX(-42px)] lg:[transform:translateX(-48px)]"
    >
      Football
    </div>
  </div>
  <div class="flex mx-2 group h-full" v-else>
    <div class="flex justify-center anton-regular items-center mx-auto">
      <img
        v-if="host === 'walkers'"
        src="../../assets/walkers__logo.jpg"
        class="rounded-lg shadow-lg"
      />
      <img
        v-if="host === 'thecyclinggk'"
        src="../../assets/cgk.jpeg"
        class="rounded-lg shadow-lg"
      />
      <img
        v-if="host === 'teamwork'"
        class="grayscale"
        :class="{ 'filter invert': colorTheme === 'dark' }"
        src="../../assets/teamwork-logo-1color-2023.png"
      />
    </div>
  </div>
  <div
    class="flex mb-5 items-center font-light tracking-wider text-base-content text-xl md:text-2xl lg:text-3xl [transform:translateY(-10px)] md:[transform:translateY(-20px)] lg:[transform:translateY(-30px)] px-1 md:px-2 lg:px-4"
  >
    The friendly football score predictions game.
  </div>
</template>
