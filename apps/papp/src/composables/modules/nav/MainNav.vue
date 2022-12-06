<script setup lang="ts">
import { computed } from "vue";
import { useAppShell } from "../../composables/useAppShell";

const { themeColor } = useAppShell();

const themeClass = computed(() =>
  ["black", "white"].includes(themeColor.value)
    ? null
    : `fill-${themeColor.value}-500`
);
</script>
<template>
  <div
    class="flex md:flex-col content-center justify-between items-center flex-1 z-50 h-full md:h-auto"
  >
    <div
      class="border-pink-400 fill-pink-500 border-blue-400 fill-blue-500 border-orange-400 fill-orange-500 border-purple-400 fill-purple-500"
    />
    <div>
      <router-link
        alt="Home"
        to="/"
        class="px-3 py-3 flex justify-center items-center"
      >
        <svg :class="`w-10 h-10 ${themeClass || 'brand'}`" viewBox="0 0 48 48">
          <g>
            <path
              d="M5.899999237060548,-7.629394538355427e-7 c-5.6,0 -5.9,5.3 -5.9,5.6 v38.9 c19.9,0 35.2,0 38.6,0 c5.6,0 5.9,-5.3 5.9,-5.6 V-7.629394538355427e-7 H5.899999237060548 zM7.099999237060544,13.599999237060544 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3,-2.1 c0,2.8 -2.8,5.1 -6.3,5.1 C9.99999923706055,18.699999237060545 7.099999237060544,16.39999923706055 7.099999237060544,13.599999237060544 zM32.49999923706055,30.599999237060544 c-1.5,0.9 -3.2,1.5 -5.1,2 c-1.6,0.4 -3.2,0.6000000000000001 -4.9,0.6000000000000001 c-2,0 -3.9,-0.30000000000000004 -5.8,-0.8 c-1.7000000000000002,-0.5 -3.3,-1.2 -4.7,-2 c-0.9,-0.6000000000000001 -1.1,-1.7000000000000002 -0.6000000000000001,-2.6 c0.6000000000000001,-0.9 1.7000000000000002,-1.1 2.6,-0.6000000000000001 c1.1,0.7000000000000001 2.3,1.2 3.7,1.6 c2.8,0.8 6,0.8 8.9,0.2 c1.5,-0.4 2.9,-0.9 4,-1.6 c0.9,-0.5 2,-0.2 2.6,0.6000000000000001 C33.699999237060545,28.89999923706055 33.39999923706055,30.099999237060544 32.49999923706055,30.599999237060544 zM31.89999923706055,18.699999237060545 c-3.5,0 -6.3,-2.3 -6.3,-5.1 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3,-2.1 C38.199999237060545,16.39999923706055 35.29999923706055,18.699999237060545 31.89999923706055,18.699999237060545 z"
              id="svg_1"
              class=""
              fill="inherit"
              fill-opacity="1"
            />
          </g>
        </svg>
        <span class="hidden font-medium">CONCORDS</span>
        <span class="hidden font-black text-accent ml-1 text-xl">.</span>
      </router-link>
    </div>
    <div class="flex flex-col flex-1 justify-end mr-2 md:mr-0 md:mb-4">
      <ul class="flex md:flex-col justify-end md:items-center md:mt-8 gap-3">
        <li>
          <RouterLink
            to="/ledger"
            class="text-white flex justify-center items-center p-2 rounded-full border-2 border-orange-300 bg-white bg-opacity-10 hover:bg-orange-500 hover:text-white transition-all"
            active-class="bg-orange-500 !text-white bg-opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/identity"
            class="text-white flex justify-center items-center p-2 rounded-full border-2 border-blue-300 bg-white bg-opacity-10 hover:bg-blue-500 hover:text-white transition-all"
            active-class="!bg-blue-500 !text-white bg-opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/encryption"
            class="text-white flex justify-center items-center p-2 rounded-full border-2 border-pink-300 bg-white bg-opacity-10 hover:bg-pink-500 hover:text-white transition-all"
            active-class="!bg-pink-500 !text-white bg-opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/storage"
            class="text-white flex justify-center items-center p-2 rounded-full border-2 border-purple-300 bg-white bg-opacity-10 hover:bg-purple-500 hover:text-white transition-all"
            active-class="bg-purple-500 !text-white bg-opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>
<style scoped>
.brand {
  fill: #f7accf;
}
</style>
