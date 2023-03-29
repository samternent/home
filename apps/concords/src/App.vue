<script setup lang="ts">
import { shallowRef, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useLocalStorage } from "@vueuse/core";
import solidLogo from "@/assets/solid_logo.png";

import {
  IdentityAvatar,
  useIdentity,
  IdentityDrawer,
} from "./modules/identity";

import { SolidDrawer } from "@/modules/solid";

import { AppShell } from "@/modules/appShell";

const isCollapsed = useLocalStorage("isSidebarCollapsed", true);
const { publicKeyPEM } = useIdentity();
const showIdentityPanel = shallowRef(false);
const showSolidPanel = shallowRef(false);
</script>

<template>
  <AppShell>
    <template #side-nav>
      <div class="flex flex-col h-screen flex-1 justify-between">
        <div>
          <RouterLink
            to="/"
            class="flex p-2 py-4 items-center justify-center w-full"
          >
            <svg class="w-10 h-10 fill-yellow-400" viewBox="0 0 48 48">
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
          </RouterLink>
        </div>
        <div class="flex flex-col items-center justify-center py-8">
          <VBtn @click="showSolidPanel = true" variant="plain"
            ><img :src="solidLogo" class="mx-3"
          /></VBtn>
          <button
            @click="showIdentityPanel = true"
            class="flex p-2 m-2 rounded items-center justify-center w-full"
          >
            <IdentityAvatar :identity="publicKeyPEM" size="md" />
          </button>
        </div>
      </div>
    </template>
    <RouterView />

    <transition name="slide">
      <div
        class="z-50 fixed top-0 right-0 h-screen left-16 md:left-auto md:w-[550px] px-2 bg-zinc-800 border-l border-zinc-600"
        v-if="showIdentityPanel"
      >
        <div class="flex justify-end w-full p-2">
          <button @click="showIdentityPanel = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <IdentityDrawer v-if="showIdentityPanel" />
      </div>
    </transition>
    <transition name="slide">
      <div
        class="z-50 fixed top-0 right-0 h-screen left-16 md:left-auto md:w-[550px] p-2 bg-zinc-800 border-l border-zinc-600"
        v-if="showSolidPanel"
      >
        <div class="flex justify-end w-full p-2">
          <button @click="showSolidPanel = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <SolidDrawer v-if="showSolidPanel" />
      </div>
    </transition>
  </AppShell>
</template>

<style scoped>
.slide-enter-active {
  animation: slide-in 0.3s;
}
.slide-leave-active {
  animation: slide-in 0.3s reverse;
}
@keyframes slide-in {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
