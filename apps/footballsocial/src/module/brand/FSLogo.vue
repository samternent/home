<script setup>
import { useWhiteLabel } from "./useWhiteLabel";

const { isWhiteLabel, host } = useWhiteLabel();
</script>
<template>
  <div class="flex mx-2 group" v-if="!isWhiteLabel">
    <div class="flex flex-col justify-center -translate-x-6 anton-regular">
      <div
        class="bg-base-content text-base-100 text-[24.3px] md:text-[30.7px] lg:text-[43.9px] [transform:rotate(-90deg)translate(0px,0px)] md:[transform:rotate(-90deg)translate(0px,0px)] lg:[transform:rotate(-90deg)translate(0px,24px)] px-2 uppercase"
      >
        Social
      </div>
    </div>
    <div
      class="font-bold text-base-content text-[78px] md:text-[96px] lg:text-[136px] uppercase anton-regular [transform:translateX(-40px)] md:[transform:translateX(-42px)] lg:[transform:translateX(-24px)]"
    >
      Football
    </div>
  </div>
  <div class="flex mx-2 group" v-else>
    <div
      class="flex flex-col justify-center anton-regular items-center w-48 p-4 mx-auto"
    >
      <img src="../../assets/walkers__logo.png" />
    </div>
    <!-- <div
      class="flex items-center font-bold text-base-content text-6xl md:text-7xl lg:text-9xl uppercase anton-regular"
    >
      {{ host }}
    </div> -->
  </div>
</template>
