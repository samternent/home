<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import AppShellControlPanelLog from "./panels/AppShellControlPanelLog.vue";
import AppShellControlPanelHistory from "./panels/AppShellControlPanelHistory.vue";
import AppShellControlPanelCommit from "./panels/AppShellControlPanelCommit.vue";
import AppShellControlPanelSave from "./panels/AppShellControlPanelSave.vue";

const activeLHSView = useLocalStorage("controlPanel/lhs", "log");
const activeRHSView = useLocalStorage("controlPanel/rhs", "commit");
</script>

<template>
  <div class="flex w-full flex-col lg:flex-row">
    <div
      class="border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-700 flex-1 overflow-auto max-w-1/2"
    >
      <VTabs
        v-model="activeLHSView"
        theme="dark"
        class="sticky top-0 bg-zinc-800 z-20"
      >
        <VTab value="log">Log</VTab>
        <VTab value="history">History</VTab>
      </VTabs>

      <AppShellControlPanelLog v-if="activeLHSView === 'log'" />
      <AppShellControlPanelHistory v-if="activeLHSView === 'history'" />
    </div>
    <div class="flex flex-col flex-1 overflow-auto">
      <VTabs
        v-model="activeRHSView"
        theme="dark"
        class="sticky top-0 bg-zinc-800 z-20"
      >
        <VTab value="commit">Commit</VTab>
        <VTab value="save">Save</VTab>
      </VTabs>
      <AppShellControlPanelCommit v-if="activeRHSView === 'commit'" />
      <AppShellControlPanelSave v-if="activeRHSView === 'save'" />
      <!-- <div
        class="flex items-center justify-end opacity-50 hover:opacity-80 transition-opacity cursor-default"
      >
        <div class="p-2 rounded-tl-lg">
          <svg class="w-10 h-10 fill-yellow-500" viewBox="0 0 48 48">
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
        </div>
        <div class="py-1 pl-2 pr-4 rounded-br-lg">
          <div class="font-medium flex items-center text-xs">
            <span class="text-xl font-sans -mb-1 mr-2"
              >concords<span class="text-indigo-600 font-6xl">•</span>app</span
            >
          </div>
          <a
            class="text-pink-500 hover:underline hover:text-pink-600 text-xs font-sans"
            href="https://teamconcords.com/"
            target="_blank"
            >Team Concords Limited.</a
          >
        </div>
      </div> -->
      <!-- <a
        class="text-pink-500 underline hover:text-pink-600 text-sm"
        href="https://teamconcords.com/"
        target="_blank"
        >Team Concords Limited.</a
      > -->
    </div>
  </div>
</template>
