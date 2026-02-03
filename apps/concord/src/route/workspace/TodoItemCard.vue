<script setup lang="ts">
import { computed } from "vue";

import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";

type LedgerItem = {
  id: string;
  title: string;
  completed?: boolean;
  assignedTo?: { id?: string; publicIdentityKey?: string } | null;
  keyMissing?: boolean;
  createdAt?: number;
  permission?: string;
  [key: string]: unknown;
};

type ItemEntry = {
  entryId: string;
  data: LedgerItem;
};

const props = defineProps<{
  item: ItemEntry;
  active: boolean;
  formatDate?: (value: string | number) => string;
}>();

const emit = defineEmits<{
  (event: "toggle", item: LedgerItem): void;
  (event: "activate", entryId: string): void;
}>();

const isCollapsed = computed(() => !props.active);
</script>

<template>
  <article
    class="group relative cursor-pointer overflow-hidden rounded-sm border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 85%, var(--ui-bg))] transition-all duration-300"
    :class="
      active
        ? 'shadow'
        : 'opacity-85 hover:opacity-100 hover:border-[var(--ui-secondary)]/70'
    "
    @click="emit('activate', item.entryId)"
  >
    <div
      class="transition-all duration-300"
      :class="active ? 'p-4 md:p-5' : 'p-3'"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <span
            v-if="item.data.keyMissing"
            class="p-2 opacity-40 flex items-center justify-center rounded-full border border-[var(--ui-border)] text-[var(--ui-critical)] cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-4 text-[var(--ui-critical)]"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </span>
          <button
            v-else
            class="flex items-center gap-3 text-left"
            @click.stop="emit('toggle', item.data)"
          >
            <span
              class="p-1 flex items-center justify-center rounded-full border border-[var(--ui-border)] opacity-80 cursor-pointer hover:border-[var(--ui-secondary)] transition-colors"
              :class="{
                'text-[var(--ui-success)] opacity-100': item.data.completed,
              }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </span>
          </button>
          <div class="flex flex-col gap-1 min-w-0">
            <span
              v-if="item.data.keyMissing"
              class="text-sm blur-sm cursor-not-allowed opacity-50"
            >
              Insufficient permission
            </span>
            <span
              v-else
              class="text-base md:text-lg font-thin truncate"
              :class="item.data.completed ? 'line-through opacity-60' : ''"
            >
              {{ item.data.title }}
            </span>
          </div>
        </div>
        <div
          class="flex items-center gap-2 transition-all duration-300"
          :class="
            isCollapsed
              ? 'opacity-0 -translate-y-1 pointer-events-none'
              : 'opacity-100 translate-y-0'
          "
        >
          <IdentityAvatar
            v-if="item.data?.assignedTo?.publicIdentityKey"
            :identity="item.data.assignedTo.publicIdentityKey"
            size="sm"
          />
          <span
            v-if="item.data.permission"
            class="p-2 opacity-60 flex items-center justify-center rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </span>
        </div>
      </div>
      <div
        class="flex flex-wrap items-center gap-2 text-xs text-[var(--ui-fg-muted)] transition-all duration-300"
        :class="
          isCollapsed
            ? 'max-h-0 opacity-0 mt-0 overflow-hidden'
            : 'max-h-12 opacity-100 mt-3'
        "
      >
        <span
          class="px-2 py-1 rounded-full border border-[var(--ui-border)]"
          :class="
            item.data.completed
              ? 'text-[var(--ui-success)] border-[var(--ui-success)]/30'
              : 'text-[var(--ui-secondary)] border-[var(--ui-secondary)]/40'
          "
        >
          {{ item.data.completed ? "Done" : "Open" }}
        </span>
        <span
          v-if="item.data?.createdAt && formatDate"
          class="px-2 py-1 rounded-full border border-[var(--ui-border)]"
        >
          {{ formatDate(item.data.createdAt) }}
        </span>
        <span
          v-if="item.data?.assignedTo?.publicIdentityKey"
          class="px-2 py-1 rounded-full border border-[var(--ui-border)]"
        >
          Assigned
        </span>
      </div>
    </div>
  </article>
</template>
