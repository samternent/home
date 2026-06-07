<script setup lang="ts">
import { computed, defineAsyncComponent, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Tabs } from "ternent-ui/primitives";
import {
  getRuntimeAppById,
  isRuntimeAppRegistryValid,
  isSupportedRuntimeSurface,
  resolveDefaultRuntimeSurface,
  resolveRuntimeSurface,
} from "@/runtime/apps";

const route = useRoute();
const router = useRouter();

const appId = computed(() => {
  const value = route.params.appId;
  return typeof value === "string" ? value : "";
});

const surfaceId = computed(() => {
  const value = route.params.surfaceId;
  return typeof value === "string" ? value : undefined;
});

const app = computed(() => getRuntimeAppById(appId.value));

watchEffect(() => {
  if (!app.value || surfaceId.value) {
    return;
  }

  if (!isRuntimeAppRegistryValid(app.value)) {
    return;
  }

  const defaultSurface = resolveDefaultRuntimeSurface(app.value);
  if (!defaultSurface) {
    return;
  }

  if (route.fullPath === `/w/${app.value.id}/${defaultSurface.id}`) {
    return;
  }

  void router.replace(`/w/${app.value.id}/${defaultSurface.id}`);
});

const surface = computed(() => {
  if (!app.value) {
    return null;
  }

  return resolveRuntimeSurface(app.value, surfaceId.value);
});

const surfaceTabs = computed(() =>
  (app.value?.surfaces ?? []).map((runtimeSurface) => ({
    value: runtimeSurface.id,
    label: runtimeSurface.label,
  })),
);

const activeSurfaceTab = computed({
  get() {
    if (surfaceId.value) {
      return surfaceId.value;
    }
    return app.value?.defaultSurfaceId ?? "";
  },
  set(nextSurfaceId: string) {
    if (!app.value || !nextSurfaceId || nextSurfaceId === surfaceId.value) {
      return;
    }
    void router.push(`/w/${app.value.id}/${nextSurfaceId}`);
  },
});

const supported = computed(() => {
  if (!app.value) {
    return false;
  }

  return isSupportedRuntimeSurface(app.value, surfaceId.value);
});

const surfaceComponent = computed(() => {
  if (!surface.value?.component) return null;

  return defineAsyncComponent(surface.value.component);
});
</script>

<template>
  <section class="flex h-full min-h-0 w-full flex-col" data-test="runtime-app-v0">
    <template v-if="app && supported">
      <div class="sticky top-0 z-20 border-b border-[var(--ui-border)] bg-[var(--ui-surface)]">
        <div class="flex items-end pt-1">
          <Tabs
            v-model="activeSurfaceTab"
            :items="surfaceTabs"
            size="md"
            variant="workspace"
            class="max-w-sm"
          />
        </div>
      </div>

      <div class="min-h-0 flex-1 flex">
        <component :is="surfaceComponent" :surface="surface?.id === 'list' ? surface : undefined" />
      </div>
      <span class="sr-only" data-test="runtime-app-title">{{ app.label }}</span>
    </template>

    <template v-else>
      <div class="mx-auto w-full max-w-3xl p-6">
        <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">Runtime v0</p>
        <h1
          class="m-0 mt-2 text-2xl font-semibold text-[var(--ui-fg)]"
          data-test="runtime-app-unsupported-title"
        >
          App route unsupported
        </h1>
        <p class="mt-3 text-sm text-[var(--ui-fg-muted)]" data-test="runtime-app-unsupported-copy">
          The requested app or surface is not registered yet.
        </p>
        <RouterLink
          to="/launch"
          class="mt-4 inline-flex text-sm font-medium text-[var(--ui-primary)]"
          data-test="runtime-app-unsupported-launch-link"
        >
          Back to Launch
        </RouterLink>
      </div>
    </template>
  </section>
</template>
