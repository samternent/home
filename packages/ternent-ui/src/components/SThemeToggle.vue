<script setup>
import { computed, getCurrentInstance, ref } from "vue";
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
  type: String,
  required: false,
});

const instance = getCurrentInstance();
const menuRef = ref(null);
const isOpen = ref(false);

const themeOptions = [
  { name: "print", label: "Print" },
  { name: "spruce", label: "Spruce" },
  { name: "citrine", label: "Citrine" },
  { name: "harbor", label: "Harbor" },
  { name: "obsidian", label: "Obsidian" },
  { name: "pixpax", label: "PixPax" },
  { name: "garnet", label: "Garnet" },
  { name: "prism", label: "Prism" },
  { name: "sunset", label: "Sunset" },
  { name: "aurora", label: "Aurora" },
];

const sizeClasses = computed(() => ({
  xs: {
    trigger: "h-8 w-8",
    icon: "h-3.5 w-3.5",
    menu: "min-w-28",
  },
  sm: {
    trigger: "h-9 w-9",
    icon: "h-4 w-4",
    menu: "min-w-32",
  },
  md: {
    trigger: "h-10 w-10",
    icon: "h-5 w-5",
    menu: "min-w-36",
  },
  lg: {
    trigger: "h-12 w-12",
    icon: "h-6 w-6",
    menu: "min-w-40",
  },
}));

const internalTheme = ref(themeModel.value || themeOptions[0]?.name || "print");
const internalMode = ref(getSystemMode());

function getSystemMode() {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
}

function getDocumentThemeAttribute() {
  if (typeof document === "undefined") return "";
  return document.documentElement.getAttribute("data-theme") || "";
}

function getThemePrefix() {
  if (typeof document === "undefined") return "";

  const root = document.documentElement;
  if (root.dataset.themePrefix) return root.dataset.themePrefix;

  const currentTheme = getDocumentThemeAttribute();
  const match = currentTheme.match(/^(.*)-(light|dark)$/);
  return match?.[1] || "";
}

function getThemeStorageKey() {
  if (typeof document === "undefined") return "";
  return document.documentElement.dataset.themeStorageKey || "";
}

function getDocumentMode() {
  const currentTheme = getDocumentThemeAttribute();
  if (currentTheme.endsWith("-dark")) return "dark";
  if (currentTheme.endsWith("-light")) return "light";
  return getSystemMode();
}

internalMode.value = getDocumentMode();

function hasExternalModelBinding() {
  const vnodeProps = instance?.vnode.props ?? {};
  return (
    Object.prototype.hasOwnProperty.call(vnodeProps, "modelValue") ||
    Object.prototype.hasOwnProperty.call(vnodeProps, "onUpdate:modelValue")
  );
}

function persistDocumentMode(nextMode) {
  const storageKey = getThemeStorageKey();
  if (!storageKey || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, nextMode);
  } catch {}
}

function applyDocumentMode(nextMode) {
  if (typeof document === "undefined") return;

  const prefix = getThemePrefix();
  if (prefix) {
    document.documentElement.setAttribute("data-theme", `${prefix}-${nextMode}`);
  }

  persistDocumentMode(nextMode);
  internalMode.value = nextMode;
}

const currentMode = computed(() => {
  if (hasExternalModelBinding() && (themeModel.value === "dark" || themeModel.value === "light")) {
    return themeModel.value;
  }

  return internalMode.value;
});

const currentTheme = computed(() => {
  if (hasExternalModelBinding() && themeModel.value) {
    return themeModel.value;
  }

  return internalTheme.value;
});

const currentThemeOption = computed(
  () => themeOptions.find((theme) => theme.name === currentTheme.value) || themeOptions[0],
);

function toggleMode() {
  const nextMode = currentMode.value === "dark" ? "light" : "dark";

  if (hasExternalModelBinding()) {
    themeModel.value = nextMode;
  } else {
    applyDocumentMode(nextMode);
  }
}

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function selectTheme(nextTheme) {
  if (hasExternalModelBinding()) {
    themeModel.value = nextTheme;
  } else {
    internalTheme.value = nextTheme;
  }

  isOpen.value = false;
}

onClickOutside(menuRef, () => {
  isOpen.value = false;
});
</script>

<template>
  <div
    v-if="props.showDropdown"
    ref="menuRef"
    class="relative inline-flex"
  >
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-[var(--ui-fg)] transition hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
      :class="sizeClasses[size].trigger"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-label="`Theme ${currentThemeOption?.label || 'selector'}`"
      @click="toggleMenu"
    >
      <span class="text-xs font-medium">
        {{ currentThemeOption?.label || "Theme" }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-3.5 w-3.5"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-[calc(100%+0.5rem)] z-[100] rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-2 shadow-[var(--ui-shadow-md)]"
      :class="sizeClasses[size].menu"
    >
      <div class="flex flex-col gap-1">
        <button
          v-for="theme in themeOptions"
          :key="theme.name"
          type="button"
          class="rounded-lg px-3 py-2 text-left text-xs transition hover:bg-[var(--ui-surface-hover)]"
          :class="{
            'bg-[var(--ui-surface)] text-[var(--ui-fg)]': currentTheme === theme.name,
            'text-[var(--ui-fg-muted)]': currentTheme !== theme.name,
          }"
          @click="selectTheme(theme.name)"
        >
          {{ theme.label }}
        </button>
      </div>
    </div>
  </div>

  <button
    v-else
    type="button"
    class="inline-flex items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] transition hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
    :class="sizeClasses[size].trigger"
    :aria-label="currentMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggleMode"
  >
    <svg
      v-if="currentMode === 'light'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :class="sizeClasses[size].icon"
    >
      <circle cx="12" cy="12" r="5" />
      <path
        d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
      />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :class="sizeClasses[size].icon"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>
