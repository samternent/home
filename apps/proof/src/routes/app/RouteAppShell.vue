<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { SButton, STabs } from "ternent-ui/components";
import { useIdentitySession } from "@/modules/identity";
import OfflineBanner from "@/modules/offline/components/OfflineBanner.vue";

const route = useRoute();
const { identity, hasIdentity } = useIdentitySession();

const tabs = [
  { path: "/app/identity", title: "Identity" },
  { path: "/app/sign", title: "Sign" },
  { path: "/app/verify", title: "Verify" },
];

const copied = ref(false);

const fingerprintShort = computed(() => {
  if (!identity.value?.fingerprint) return "No identity loaded";
  const value = identity.value.fingerprint;
  return `${value.slice(0, 8)}...${value.slice(-8)}`;
});

const currentPath = computed(() => route.path);

const copyFingerprint = async () => {
  if (!identity.value?.fingerprint || copied.value) return;

  try {
    await navigator.clipboard.writeText(identity.value.fingerprint);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1200);
  } catch {
    copied.value = false;
  }
};
</script>

<template>
  <div
    class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 md:px-8 md:py-12"
  >
    <header class="mb-8 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="m-0 text-2xl font-medium tracking-tight">Proof</h1>
        </div>

        <div
          class="inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.04)] px-3 py-1.5"
        >
          <span class="text-xs font-medium text-fg-muted">Active identity</span>
          <span class="font-mono text-xs text-fg">{{ fingerprintShort }}</span>
          <SButton
            variant="ghost"
            size="micro"
            :disabled="!hasIdentity"
            @click="copyFingerprint"
          >
            {{ copied ? "Copied" : "Copy" }}
          </SButton>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 py-4">
        <STabs :items="tabs" :path="currentPath" type="pills" size="micro" />

        <div class="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/samternent/home/apps/proof"
            target="_blank"
            rel="noreferrer"
            class="text-fg-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
          >
            GitHub
          </a>
          <RouterLink
            to="/"
            class="text-fg-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
          >
            Home
          </RouterLink>
        </div>
      </div>
    </header>

    <OfflineBanner class="mb-8" />

    <main class="flex-1">
      <div class="mx-auto w-full max-w-4xl">
        <RouterView />
      </div>
    </main>

    <footer class="mt-10 border-t border-border pt-4 text-xs text-fg-muted">
      Fully client-side. No data leaves your browser.
    </footer>
  </div>
</template>
