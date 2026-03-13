<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { Badge, Button, Card, Separator } from "ternent-ui/primitives";
import { PageSurface } from "ternent-ui/patterns";
import { useIdentitySession } from "@/modules/identity";
import OfflineBanner from "@/modules/offline/components/OfflineBanner.vue";

const route = useRoute();
const { identity, hasIdentity } = useIdentitySession();

const tabs = [
  { path: "/app/identity", title: "Identity", name: "app-identity" },
  { path: "/app/sign", title: "Sign", name: "app-sign" },
  { path: "/app/verify", title: "Verify", name: "app-verify" },
];

const copied = ref(false);

const fingerprintShort = computed(() => {
  if (!identity.value?.fingerprint) return "No identity loaded";
  const value = identity.value.fingerprint;
  return `${value.slice(0, 8)}...${value.slice(-8)}`;
});

const currentPath = computed(() => route.path);
const currentTabTitle = computed(
  () =>
    tabs.find((tab) => route.path.startsWith(tab.path))?.title ?? "Workspace",
);
const statusTone = computed(() => (hasIdentity.value ? "success" : "neutral"));
const statusLabel = computed(() =>
  hasIdentity.value ? "Identity active" : "No identity",
);

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
  <PageSurface>
    <div class="relative">
      <header class="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div class="flex flex-col gap-5">
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <RouterLink
              to="/"
              class="flex items-center gap-3 text-[var(--ui-fg)] no-underline"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M10 13a5 5 0 0 1 0-7l1.2-1.2a5 5 0 1 1 7.1 7.1L17 13"
                />
                <path
                  d="M14 11a5 5 0 0 1 0 7l-1.2 1.2a5 5 0 0 1-7.1-7.1L7 11"
                />
              </svg>
              <div class="flex flex-col gap-0.5">
                <span class="text-lg font-medium tracking-tight"
                  >Portable Proof</span
                >
                <span
                  class="text-xs uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
                >
                  Browser-native verification
                </span>
              </div>
            </RouterLink>

            <div class="flex flex-wrap items-center gap-2">
              <Button
                as="RouterLink"
                to="/"
                size="sm"
                variant="plain-secondary"
              >
                Home
              </Button>
              <Button
                as="a"
                href="https://github.com/samternent/home/tree/main/apps/proof"
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="plain-secondary"
              >
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-6xl px-6 lg:px-8">
        <Separator />
      </div>

      <main class="mx-auto max-w-6xl px-6 pb-16 pt-8 lg:px-8">
        <div class="grid gap-6">
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
            <Card variant="panel" padding="sm" class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="space-y-1">
                  <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                    Workspace
                  </p>
                  <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                    Browser-native signing and verification with local identity control.
                  </p>
                </div>

                <Badge tone="primary" variant="outline">
                  {{ currentTabTitle }}
                </Badge>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button
                  v-for="tab in tabs"
                  :key="tab.path"
                  as="RouterLink"
                  :to="tab.path"
                  size="sm"
                  :variant="
                    currentPath.startsWith(tab.path)
                      ? 'secondary'
                      : 'plain-secondary'
                  "
                >
                  {{ tab.title }}
                </Button>
              </div>
            </Card>

            <Card variant="subtle" padding="sm" class="space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                    Active signer
                  </p>
                  <p class="proof-shell-copy m-0 text-sm text-[var(--ui-fg)]">
                    {{ fingerprintShort }}
                  </p>
                </div>

                <Badge :tone="statusTone" variant="soft">
                  {{ statusLabel }}
                </Badge>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  :disabled="!hasIdentity"
                  @click="copyFingerprint"
                >
                  {{ copied ? "Copied" : "Copy fingerprint" }}
                </Button>
                <Button
                  as="RouterLink"
                  to="/app/identity"
                  size="xs"
                  variant="plain-secondary"
                >
                  Manage identity
                </Button>
              </div>
            </Card>
          </div>

          <OfflineBanner />

          <section class="space-y-6">
            <RouterView />
          </section>
        </div>
      </main>

      <footer class="mx-auto max-w-6xl px-6 pb-10 lg:px-8">
        <Separator />
        <div
          class="flex flex-col gap-3 py-6 text-sm text-[var(--ui-fg-muted)] sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="m-0">Fully client-side. No data leaves your browser.</p>
          <p class="m-0">
            Portable proofs for text, files, and release artifacts.
          </p>
        </div>
      </footer>
    </div>
  </PageSurface>
</template>
