<script setup lang="ts">
import { AppShell } from "@/modules/appShell";
</script>

<template>
  <AppShell>
    <div class="flex-1 justify-center items-center max-w-screen-xl mx-auto">
      <div
        class="border-l-8 pl-4 border-zinc-800 text-6xl font-light text-green-300 my-8 tracking-tighter flex items-end"
      >
        <h1>gzip</h1>
        <span class="tracking-tightest text-3xl text-white">.app</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-8 h-8 mx-3 text-zinc-200"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      </div>
      <RouterView />
    </div>
  </AppShell>
</template>
