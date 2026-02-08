<script setup>
import { computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps({
  size: {
    type: String,
    default: "md",
    validator: (value) => ["xs", "sm", "md", "lg"].includes(value),
  },
  showDropdown: {
    type: Boolean,
    default: false,
  },
});

const themeModel = defineModel({
  type: [String, Boolean],
  required: true,
});

const themes = [
  {
    name: "print",
    label: "🗞️ Print",
  },
  {
    name: "spruce",
    label: "🌲 Spruce",
  },
  {
    name: "citrine",
    label: "🍋 Citrine",
  },
  {
    name: "harbor",
    label: "🌊 Harbor",
  },
  {
    name: "obsidian",
    label: "🖤 Obsidian",
  },
  {
    name: "pixpax",
    label: " PixPax",
  },
  {
    name: "garnet",
    label: "🍯 Garnet",
  },
  {
    name: "prism",
    label: "🔮 Prism",
  },
  {
    name: "sunset",
    label: "🌅 Sunset",
  },
  {
    name: "aurora",
    label: "✨ Aurora",
  },
];

const currentTheme = computed(() => {
  const theme = themes.find((t) => t.name === props.modelValue);
  return theme || themes[0];
});

const isDark = computed(() => currentTheme.value.name.includes("-dark"));

function updateTheme(themeName) {
  themeModel.value = themeName;
  closeMenu();
}

function toggleDarkMode() {
  themeModel.value = themeModel.value === "dark" ? "light" : "dark";
}

const sizeClasses = computed(() => ({
  xs: { icon: "w-3 h-3" },
  sm: { icon: "w-4 h-4" },
  md: { icon: "w-5 h-5" },
  lg: { icon: "w-6 h-6" },
}));

const menuRef = ref(null);
const isOpen = ref(false);
const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};
const closeMenu = () => {
  isOpen.value = false;
};

onClickOutside(menuRef, closeMenu);
</script>

<template>
  <!-- Full Theme Selector Dropdown -->
  <div
    v-if="showDropdown"
    ref="menuRef"
    class="relative inline-block font-thin text-xs"
  >
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] px-3 py-1.5 text-[var(--ui-fg)] transition hover:bg-[var(--ui-surface-hover)]"
      @click="toggleMenu"
    >
      <span>{{ currentTheme.label }}</span>
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
    <div
      v-if="isOpen"
      class="absolute z-[100] w-40 left-0 bottom-[calc(100%+0.5rem)] mt-2 max-h-96 overflow-y-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-[var(--ui-shadow-md)]"
    >
      <div class="flex flex-col gap-1 p-2">
        <button
          v-for="theme in themes"
          :key="theme.name"
          @click="updateTheme(theme.name)"
          class="rounded-lg p-2 text-left text-xs transition hover:bg-[var(--ui-surface-hover)]"
          :class="{
            'bg-[var(--ui-surface)] text-[var(--ui-fg)]':
              props.modelValue === theme.name,
            'text-[var(--ui-fg-muted)]': props.modelValue !== theme.name,
          }"
        >
          <span class="text-xs">{{ theme.label }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Simple Toggle (for backward compatibility) -->
  <div v-else class="flex gap-2 items-center" aria-label="Toggle dark mode">
    <button
      @click="themeModel = 'light'"
      :class="[
        'cursor-pointer',
        {
          'opacity-50': themeModel === 'dark',
        },
      ]"
    >
      <!-- Sun icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="[
          sizeClasses[size].icon,
          isDark ? 'text-base-content/50' : 'text-warning',
        ]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        />
      </svg>
    </button>

    <!-- Moon icon -->
    <button
      @click="themeModel = 'dark'"
      :class="[
        'cursor-pointer',
        {
          'opacity-50': themeModel === 'light',
        },
      ]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="[
          sizeClasses[size].icon,
          isDark ? 'text-primary' : 'text-base-content/50',
        ]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  </div>
</template>
