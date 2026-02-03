<script setup lang="ts">
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const slots = [
  { time: "09:00", items: ["Design review"] },
  { time: "11:00", items: ["Sprint planning"] },
  { time: "14:00", items: ["Build boards view"] },
  { time: "16:00", items: [] },
];
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-end justify-between px-3">
      <div class="flex flex-col gap-1">
        <h2 class="text-xl">Calendar.</h2>
        <p class="text-sm opacity-70">Keep time blocks close to tasks.</p>
      </div>
      <button
        type="button"
        class="px-4 py-2 rounded-full border border-[var(--ui-border)] text-xs"
      >
        New event
      </button>
    </div>

    <section
      class="rounded-3xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 mx-3"
    >
      <div class="grid grid-cols-7 gap-2 text-xs uppercase tracking-[0.2em]">
        <div
          v-for="day in days"
          :key="day"
          class="text-center opacity-60"
        >
          {{ day }}
        </div>
      </div>
      <div class="mt-4 flex flex-col gap-3">
        <div
          v-for="slot in slots"
          :key="slot.time"
          class="flex items-start gap-4"
        >
          <span class="text-xs opacity-60 w-12">{{ slot.time }}</span>
          <div class="flex-1 flex flex-col gap-2">
            <div
              v-if="!slot.items.length"
              class="rounded-2xl border border-dashed border-[var(--ui-border)] p-3 text-xs opacity-50"
            >
              Empty slot
            </div>
            <div
              v-for="item in slot.items"
              :key="item"
              class="rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 70%, transparent)] p-3 text-sm font-thin"
            >
              {{ item }}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
