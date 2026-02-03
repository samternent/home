<script setup lang="ts">
const columns = [
  {
    id: "focus",
    title: "Focus",
    items: [
      { id: "f1", title: "Ship cards layout" },
      { id: "f2", title: "Tidy active states" },
    ],
  },
  {
    id: "in-progress",
    title: "In progress",
    items: [
      { id: "p1", title: "Refactor workspace routes" },
      { id: "p2", title: "Add calendar scaffold" },
    ],
  },
  {
    id: "backlog",
    title: "Backlog",
    items: [
      { id: "b1", title: "Add filters" },
      { id: "b2", title: "Archive old items" },
    ],
  },
];
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-end justify-between px-3">
      <div class="flex flex-col gap-1">
        <h2 class="text-xl">Boards.</h2>
        <p class="text-sm opacity-70">Drag work across stages.</p>
      </div>
      <button
        type="button"
        class="px-4 py-2 rounded-full border border-[var(--ui-border)] text-xs"
      >
        New column
      </button>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-3 gap-3 px-3 pb-6 items-start"
    >
      <section
        v-for="column in columns"
        :key="column.id"
        class="rounded-3xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 flex flex-col gap-3 min-h-[14rem]"
      >
        <header class="flex items-center justify-between">
          <h3 class="text-sm uppercase tracking-[0.2em] opacity-70">
            {{ column.title }}
          </h3>
          <span
            class="text-xs px-2 py-1 rounded-full border border-[var(--ui-border)]"
          >
            {{ column.items.length }}
          </span>
        </header>
        <div class="flex flex-col gap-3">
          <article
            v-for="item in column.items"
            :key="item.id"
            class="rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 65%, transparent)] p-3"
          >
            <p class="text-sm font-thin">{{ item.title }}</p>
            <div class="mt-3 flex items-center gap-2 text-xs opacity-60">
              <span class="px-2 py-0.5 rounded-full border">Task</span>
              <span class="px-2 py-0.5 rounded-full border">Today</span>
            </div>
          </article>
          <button
            type="button"
            class="rounded-2xl border border-dashed border-[var(--ui-border)] p-3 text-left text-sm opacity-60 hover:opacity-100 transition"
          >
            + Add card
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
