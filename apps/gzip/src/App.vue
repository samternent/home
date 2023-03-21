<script setup lang="ts">
import { AppShell } from "@/modules/appShell";
</script>

<template>
  <AppShell>
    <div class="flex-1 justify-center items-center max-w-screen-xl mx-auto">
      <div
        class="border-l-8 pl-2 pb-1 border-green-200 text-6xl font-light text-green-300 mt-8 tracking-tighter flex items-end"
      >
        <h1>gzip</h1>
        <span class="tracking-tightest font-medium text-2xl text-zinc-300"
          >.app</span
        >
      </div>
      <p
        class="rounded-r border-l-8 pl-2 bg-green-300 border-zinc-100 inline-block text-lg font-medium px-4 mb-4 text-zinc-900 tracking-tightest"
      >
        no frills, gzip compression.
      </p>
      <RouterView />
    </div>
  </AppShell>
</template>
