<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { LandingPage } from "ternent-ui/patterns";
import { suitesBySlug } from "@/routes/suites/registry";
import { useThemeMode } from "@/modules/ui";

const route = useRoute();
const { mode } = useThemeMode();
const rootThemeMode = ref<"light" | "dark" | null>(null);

function parseThemeMode(value: string | null): "light" | "dark" | null {
  if (!value) return null;
  if (value.endsWith("-dark")) return "dark";
  if (value.endsWith("-light")) return "light";
  return null;
}

function syncRootThemeModeFromDocument() {
  if (typeof document === "undefined") return;
  rootThemeMode.value = parseThemeMode(document.documentElement.getAttribute("data-theme"));
}

let rootThemeObserver: MutationObserver | null = null;

onMounted(() => {
  if (typeof document === "undefined") return;

  syncRootThemeModeFromDocument();

  rootThemeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
        syncRootThemeModeFromDocument();
      }
    }
  });

  rootThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
});

onBeforeUnmount(() => {
  rootThemeObserver?.disconnect();
  rootThemeObserver = null;
});

const suite = computed(() => {
  const suiteKey =
    typeof route.meta.suiteKey === "string"
      ? route.meta.suiteKey
      : typeof route.params.slug === "string"
        ? route.params.slug
        : "";
  return suitesBySlug[suiteKey];
});

const suiteTheme = computed(() => {
  const theme =
    typeof route.meta.suiteTheme === "string" ? route.meta.suiteTheme : suite.value?.themeName;
  return theme || "aurora";
});

const suiteMode = computed(() => {
  const overrideMode = route.meta.suiteMode;
  if (overrideMode === "light" || overrideMode === "dark") {
    return overrideMode;
  }
  if (rootThemeMode.value === "light" || rootThemeMode.value === "dark") {
    return rootThemeMode.value;
  }
  if (mode.value === "light" || mode.value === "dark") {
    return mode.value;
  }
  return suite.value?.defaultThemeMode ?? "dark";
});

const suiteThemeData = computed(() => `${suiteTheme.value}-${suiteMode.value}`);

watchEffect(() => {
  if (typeof document === "undefined" || !suite.value) return;

  document.title = suite.value.title;

  const description = suite.value.seo.description;
  const descriptionMeta = document.head.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.setAttribute("content", description);
  }

  const themeColorMeta = document.head.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", suite.value.seo.themeColor);
  }
});
</script>

<template>
  <div v-if="suite" class="suite-route" :data-suite="suite.slug">
    <section class="suite-route__theme-surface" :data-theme="suiteThemeData">
      <LandingPage :app-title="suite.title" :config="suite.landing" />
    </section>
  </div>
</template>

<style scoped>
.suite-route {
  min-height: 100%;
}

.suite-route__global-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--ui-bg) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid color-mix(in srgb, var(--ui-border) 80%, transparent);
}

.suite-route__global-nav-inner {
  margin: 0 auto;
  max-width: 80rem;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.suite-route__home-link {
  color: var(--ui-fg);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.suite-route__suite-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suite-route__suite-link {
  color: var(--ui-fg-muted);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid color-mix(in srgb, var(--ui-border) 80%, transparent);
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
}

.suite-route__suite-link:hover {
  color: var(--ui-fg);
  background: color-mix(in srgb, var(--ui-surface) 86%, transparent);
}

.suite-route__theme-surface {
  min-height: 100%;
  background: var(--ui-bg);
  color: var(--ui-fg);
  isolation: isolate;
}
</style>
