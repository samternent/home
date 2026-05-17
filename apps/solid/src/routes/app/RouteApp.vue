<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useAppApi } from "@/app/api";
import { DEFAULT_DEV_SESSION_UNLOCK_STORAGE_KEY } from "@/app/runtime";
import AppShell from "@/modules/appShell/AppShell.vue";

const appApi = useAppApi();
const isUnlocked = computed(
  () => appApi.status.value === "ready" && appApi.identity.activeIdentity.value !== null,
);

function hasDevSessionResumeCandidate(): boolean {
  if (!import.meta.env.DEV) {
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(window.sessionStorage.getItem(DEFAULT_DEV_SESSION_UNLOCK_STORAGE_KEY));
}

onMounted(() => {
  if (!hasDevSessionResumeCandidate()) {
    return;
  }

  void appApi.identity.ensureUnlocked("auto").catch(() => undefined);
});
</script>

<template>
  <AppShell>
    <RouterView v-if="isUnlocked" />
    <div v-else class="sr-only" data-test="identity-shell-locked">Identity locked</div>
  </AppShell>
</template>
