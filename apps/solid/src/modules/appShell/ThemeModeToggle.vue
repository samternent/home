<script setup lang="ts">
import { computed, ref } from "vue";
import { Button } from "ternent-ui/primitives";

const currentMode = ref<"light" | "dark">("light");

function getSystemMode(): "light" | "dark" {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "light";
}

function getDocumentThemeAttribute(): string {
  if (typeof document === "undefined") {
    return "";
  }
  return document.documentElement.getAttribute("data-theme") || "";
}

function getThemePrefix(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const root = document.documentElement;
  if (root.dataset.themePrefix) {
    return root.dataset.themePrefix;
  }

  const currentTheme = getDocumentThemeAttribute();
  const match = currentTheme.match(/^(.*)-(light|dark)$/);
  return match?.[1] || "";
}

function getThemeStorageKey(): string {
  if (typeof document === "undefined") {
    return "";
  }
  return document.documentElement.dataset.themeStorageKey || "";
}

function syncModeFromDocument(): void {
  const currentTheme = getDocumentThemeAttribute();
  if (currentTheme.endsWith("-dark")) {
    currentMode.value = "dark";
    return;
  }

  if (currentTheme.endsWith("-light")) {
    currentMode.value = "light";
    return;
  }

  currentMode.value = getSystemMode();
}

function persistMode(nextMode: "light" | "dark"): void {
  const storageKey = getThemeStorageKey();
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, nextMode);
  } catch {
    // no-op: localStorage may be unavailable in constrained environments
  }
}

function applyMode(nextMode: "light" | "dark"): void {
  if (typeof document !== "undefined") {
    const prefix = getThemePrefix();
    if (prefix) {
      document.documentElement.setAttribute("data-theme", `${prefix}-${nextMode}`);
    }
  }

  persistMode(nextMode);
  currentMode.value = nextMode;
}

function toggleMode(): void {
  applyMode(currentMode.value === "dark" ? "light" : "dark");
}

syncModeFromDocument();

const ariaLabel = computed(() =>
  currentMode.value === "dark" ? "Switch to light mode" : "Switch to dark mode",
);
</script>

<template>
  <Button
    :aria-label="ariaLabel"
    variant="plain-secondary"
    size="sm"
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
      class="h-4 w-4"
      aria-hidden="true"
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
      class="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </Button>
</template>
