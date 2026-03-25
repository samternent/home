<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PageSurface } from "ternent-ui/patterns";
import { Button, Input, Spinner } from "ternent-ui/primitives";
import ConcordLauncherSurface from "@/modules/concord-os/components/ConcordLauncherSurface.vue";
import { useConcordOsKernel } from "@/modules/concord-os";

const kernel = useConcordOsKernel();
const solid = kernel.solid;
const route = useRoute();
const router = useRouter();

const providerInput = computed({
  get: () => solid.issuer.value,
  set: (next: string) => solid.setIssuer(next),
});

const navItems = [
  { to: "/app/library", label: "Library" },
  { to: "/app/sharing", label: "Sharing" },
  { to: "/app/people", label: "People" },
  { to: "/app/account", label: "Account" },
] as const;

const shellNavPath = computed(() =>
  route.path.startsWith("/app/open") ? "/app/library" : route.path,
);

const isBusy = computed(
  () =>
    solid.status.value === "restoring" || solid.status.value === "redirecting",
);
const showDesktopHome = computed(
  () =>
    solid.isAuthenticated.value &&
    kernel.workspace.status.value !== "loading" &&
    kernel.surface.value === "home",
);
const showShellSurface = computed(
  () =>
    solid.isAuthenticated.value &&
    kernel.workspace.status.value !== "loading" &&
    kernel.surface.value !== "home",
);

async function login() {
  await solid.login();
}

async function logout() {
  await solid.logout();
}

function syncSurface(path: string) {
  if (path.startsWith("/app/open")) {
    kernel.setSurface("app");
    return;
  }
  if (path.startsWith("/app/sharing")) {
    kernel.setSurface("sharing");
    return;
  }
  if (path.startsWith("/app/people")) {
    kernel.setSurface("people");
    return;
  }
  if (path.startsWith("/app/account")) {
    kernel.setSurface("account");
    return;
  }
  kernel.setSurface("home");
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    kernel.toggleLauncher();
  }
}

onMounted(async () => {
  await kernel.workspace.init();

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleGlobalKeydown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleGlobalKeydown);
  }
});

watch(
  () => route.path,
  (path) => {
    syncSurface(path);
  },
  { immediate: true },
);
</script>

<template>
  <PageSurface>
    <template v-if="!solid.isAuthenticated.value">
      <div class="flex h-full items-center justify-center px-4">
        <div
          class="w-full max-w-md rounded-[2rem] border border-[color-mix(in_srgb,var(--ui-border)_40%,white)] bg-[color-mix(in_srgb,var(--ui-bg)_78%,white)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.14)] backdrop-blur-[28px]"
        >
          <div class="space-y-4">
            <div class="space-y-1">
              <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
                Solid login
              </p>
              <h2 class="m-0 text-base font-medium text-[var(--ui-fg)]">
                Sign in with Solid
              </h2>
            </div>

            <Input
              v-model="providerInput"
              aria-label="OIDC issuer"
              placeholder="https://login.inrupt.com"
              autocomplete="url"
            />

            <div class="flex flex-wrap gap-2">
              <Button
                v-for="provider in solid.providers"
                :key="provider"
                size="xs"
                variant="plain-secondary"
                @click="solid.setIssuer(provider)"
              >
                {{ provider.replace(/^https?:\/\//, "") }}
              </Button>
            </div>

            <div
              v-if="solid.error.value"
              class="rounded-xl border border-[color-mix(in_srgb,var(--ui-danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--ui-danger)_12%,transparent)] px-3 py-2 text-[11px] text-[var(--ui-fg)]"
            >
              {{ solid.error.value }}
            </div>

            <Button
              size="sm"
              variant="secondary"
              :disabled="isBusy"
              @click="login"
            >
              {{
                solid.status.value === "redirecting"
                  ? "Redirecting..."
                  : "Continue with Solid"
              }}
            </Button>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="kernel.workspace.status.value === 'loading'">
      <div class="flex h-full items-center justify-center">
        <div class="space-y-3 text-center">
          <div class="flex justify-center">
            <Spinner size="lg" />
          </div>
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
            Concord workspace
          </p>
          <p class="m-0 text-sm text-[var(--ui-fg)]">
            Loading managed workspace...
          </p>
        </div>
      </div>
    </template>

    <template v-else-if="showDesktopHome">
      <div class="flex h-screen flex-col">
        <div class="flex items-center justify-between px-6 py-3 text-sm ]">
          <div class="flex items-center gap-5 text-lg font-medium">
            ConcordOS
          </div>
          <div class="flex items-center gap-2">
            <!-- <ThemeModeToggle /> -->
            <Button size="xs" variant="plain-secondary" @click="logout"
              >Log out</Button
            >
          </div>
        </div>
        <RouterView />
        <div class="inset-x-0 pb-3 flex justify-center z-10">
          <!-- Bottom dock -->
          <div
            class="flex items-center gap-3 rounded-[28px] border border-white/60 bg-white/70 px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            <RouterLink
              class="flex size-16 gap-2 flex-col items-center justify-center rounded-[22px] text-[var(--ui-primary)] shadow-[0_10px_25px_rgba(91,92,246,0.35)]"
              active-class="bg-[var(--ui-primary)] text-white"
              to="/app/finder"
              as="button"
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
                  d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                />
              </svg>
            </RouterLink>
            <RouterLink
              class="flex size-16 gap-2 flex-col items-center justify-center rounded-[22px] text-[var(--ui-primary)] shadow-[0_10px_25px_rgba(91,92,246,0.35)]"
              active-class="bg-[var(--ui-primary)] text-white"
              to="/app/terminal"
              as="button"
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
                  d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </RouterLink>
          </div>
        </div>
      </div>
    </template>

    <ConcordLauncherSurface
      v-if="kernel.launcherOpen.value"
      @close="kernel.hideLauncher"
    />
  </PageSurface>
</template>
