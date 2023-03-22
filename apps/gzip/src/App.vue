<script setup lang="ts">
import { AppShell } from "@/modules/appShell";
</script>

<template>
  <AppShell>
    <div class="flex flex-col flex-1 justify-center max-w-screen-xl mx-auto">
      <header>
        <div
          class="pl-3 pb-1 border-green-200 text-4xl font-light text-green-300 mt-8 tracking-tighter flex items-end"
        >
          <h1>gzip</h1>
          <span class="tracking-tightest font-medium text-xl text-green-50"
            >.app</span
          >
        </div>
      </header>
      <RouterView />
    </div>
  </AppShell>
</template>
