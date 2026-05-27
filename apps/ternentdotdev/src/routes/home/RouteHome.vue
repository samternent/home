<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Button } from "ternent-ui/primitives";
import { useThemeMode } from "@/modules/ui";

type ThemeName = "aurora" | "concord" | "ledger" | "proof" | "armour";

type NodeConfig = {
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  to: string;
  glyph: string;
  theme: ThemeName;
};

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

const activeMode = computed<"light" | "dark">(() => {
  if (rootThemeMode.value === "light" || rootThemeMode.value === "dark") {
    return rootThemeMode.value;
  }
  return mode.value === "light" ? "light" : "dark";
});

function themed(theme: ThemeName) {
  return `${theme}-${activeMode.value}`;
}

const runtimeLink = "/concord";

const concord: NodeConfig = {
  title: "@ternent/concord",
  subtitle: "Dispatch commands. Replay deterministic state.",
  description: "Runtime layer for replayable applications.",
  cta: "Explore",
  to: "/concord",
  glyph: "›_",
  theme: "concord",
};

const ledger: NodeConfig = {
  title: "@ternent/ledger",
  subtitle: "Store staged and committed history.",
  description: "Append-only replay substrate.",
  cta: "Explore",
  to: "/ledger",
  glyph: "≡",
  theme: "ledger",
};

const seal: NodeConfig = {
  title: "@ternent/seal",
  subtitle: "Prove content, commits, and releases.",
  description: "Portable signatures and attestations.",
  cta: "Explore",
  to: "/seal",
  glyph: "◇",
  theme: "proof",
};

const armour: NodeConfig = {
  title: "@ternent/armour",
  subtitle: "Encrypt sensitive payloads.",
  description: "Identity-aware access for private data.",
  cta: "Explore",
  to: "/armour",
  glyph: "▣",
  theme: "armour",
};

const identity: NodeConfig = {
  title: "@ternent/identity",
  subtitle: "Sign actions with portable keys.",
  description: "The root of trust for replayable software.",
  cta: "Explore",
  to: "/settings/identity",
  glyph: "♙",
  theme: "aurora",
};
</script>

<template>
  <main class="min-h-screen">
    <div class="min-h-screen [background:radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--ui-primary)_22%,transparent),transparent_42rem),linear-gradient(to_bottom,color-mix(in_srgb,var(--ui-bg)_84%,transparent),transparent_34rem),linear-gradient(color-mix(in_srgb,var(--ui-fg)_12%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--ui-fg)_12%,transparent)_1px,transparent_1px)] [background-size:auto,auto,32px_32px,32px_32px]">
      <section class="mx-auto max-w-6xl px-6 pb-20">
        <div class="mx-auto max-w-5xl pt-16 text-center md:pt-24">
          <p class="mb-5 text-xs font-medium uppercase tracking-[0.32em] text-[color:color-mix(in_srgb,var(--ui-primary)_86%,var(--ui-fg))]">ternent.dev</p>

          <h1 class="mx-auto max-w-5xl text-5xl font-medium tracking-[-0.065em] text-[var(--ui-fg)] md:text-8xl md:leading-[0.92]">
            Software built on signed history.
          </h1>

          <p class="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[var(--ui-fg-muted)] md:text-2xl md:leading-10">
            A runtime for replayable applications, signed workflows, and portable state. Build systems where history, identity, and trust travel with the software.
          </p>

          <div class="mt-10 flex flex-wrap justify-center gap-3">
            <Button as="RouterLink" :to="runtimeLink" variant="secondary" size="md">Launch Runtime</Button>
            <RouterLink to="/concord" class="rounded-full border border-[color:color-mix(in_srgb,var(--ui-border)_86%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg)_92%,transparent)] px-6 py-3 text-sm font-black text-[var(--ui-fg)] no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--ui-bg)_86%,transparent)]">
              Read the Spec
            </RouterLink>
          </div>

          <div class="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-[var(--ui-fg-muted)] md:text-base">
            <span>Replayable applications</span>
            <span class="hidden text-[color:color-mix(in_srgb,var(--ui-fg)_24%,transparent)] sm:inline">•</span>
            <span>Signed workflows</span>
            <span class="hidden text-[color:color-mix(in_srgb,var(--ui-fg)_24%,transparent)] sm:inline">•</span>
            <span>Portable state</span>
            <span class="hidden text-[color:color-mix(in_srgb,var(--ui-fg)_24%,transparent)] sm:inline">•</span>
            <span>Verifiable history</span>
          </div>
        </div>

        <section id="architecture" class="relative mx-auto mt-20 max-w-4xl md:mt-24">
          <div class="mb-10 text-center">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[color:color-mix(in_srgb,var(--ui-primary)_74%,var(--ui-fg))]">The protocol beneath the runtime</p>
            <h2 class="mt-3 text-3xl font-base tracking-[-0.05em] md:text-4xl">
              Runtime primitives for replayable software.
            </h2>
          </div>

          <div class="relative mx-auto">
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 text-2xl text-[var(--ui-fg-muted)]">↓</div>
          </div>

          <RouterLink :to="concord.to" :data-theme="themed(concord.theme)" class="block rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_14%,var(--ui-bg))] p-5 text-[var(--ui-fg)] no-underline transition-all duration-150 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--ui-primary)_78%,var(--ui-border))]">
            <div class="flex items-start justify-between gap-5">
              <div class="flex gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ui-primary)_36%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_16%,transparent)] text-2xl text-[var(--ui-primary)]">{{ concord.glyph }}</div>
                <div>
                  <h3 class="text-xl font-semibold tracking-[-0.04em]">{{ concord.title }}</h3>
                  <p class="mt-1 text-sm font-bold text-[var(--ui-primary)]">{{ concord.subtitle }}</p>
                  <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--ui-fg-muted)]">
                    <span class="rounded-lg border border-[color:color-mix(in_srgb,var(--ui-border)_84%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg)_86%,transparent)] px-3 py-1.5">command</span><span>→</span><span class="rounded-lg border border-[color:color-mix(in_srgb,var(--ui-border)_84%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg)_86%,transparent)] px-3 py-1.5">stage</span><span>→</span><span class="rounded-lg border border-[color:color-mix(in_srgb,var(--ui-border)_84%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg)_86%,transparent)] px-3 py-1.5">commit</span><span>→</span><span class="rounded-lg border border-[color:color-mix(in_srgb,var(--ui-border)_84%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg)_86%,transparent)] px-3 py-1.5">replay</span>
                  </div>
                </div>
              </div>
              <span class="text-sm font-black text-[var(--ui-primary)]">{{ concord.cta }} →</span>
            </div>
          </RouterLink>

          <div class="relative mx-auto h-10">
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 text-2xl text-[var(--ui-fg-muted)]">↓</div>
          </div>

          <RouterLink :to="ledger.to" :data-theme="themed(ledger.theme)" class="block rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_14%,var(--ui-bg))] p-5 text-[var(--ui-fg)] no-underline transition-all duration-150 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--ui-primary)_78%,var(--ui-border))]">
            <div class="flex items-start justify-between gap-5">
              <div class="flex gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ui-primary)_36%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_16%,transparent)] text-2xl text-[var(--ui-primary)]">{{ ledger.glyph }}</div>
                <div>
                  <h3 class="text-xl font-semibold tracking-[-0.04em]">{{ ledger.title }}</h3>
                  <p class="mt-1 text-sm font-bold text-[var(--ui-primary)]">{{ ledger.subtitle }}</p>
                  <div class="mt-4 grid max-w-md grid-cols-2 overflow-hidden rounded-xl border border-[color:color-mix(in_srgb,var(--ui-border)_84%,transparent)] text-center font-mono text-xs text-[var(--ui-fg-muted)]">
                    <span class="border-r border-[color:color-mix(in_srgb,var(--ui-border)_84%,transparent)] px-3 py-2">staged + committed</span>
                    <span class="px-3 py-2">replay substrate</span>
                  </div>
                </div>
              </div>
              <span class="text-sm font-black text-[var(--ui-primary)]">{{ ledger.cta }} →</span>
            </div>
          </RouterLink>

          <div class="relative hidden h-28 md:block">
            <svg class="absolute inset-0 h-full w-full overflow-visible text-[var(--ui-fg-muted)]" viewBox="0 0 800 120" preserveAspectRatio="none" aria-hidden="true">
              <path class="fill-none stroke-current stroke-[1.6] opacity-80" d="M400 0 C400 48 230 42 205 110" />
              <path class="fill-none stroke-current stroke-[1.6] opacity-80" d="M400 0 C400 48 570 42 595 110" />
              <circle cx="400" cy="0" r="5" class="fill-current opacity-50" />
              <path d="M205 110 l-7 -10 m7 10 l8 -9" class="fill-none stroke-current stroke-[1.6]" />
              <path d="M595 110 l-8 -9 m8 9 l7 -10" class="fill-none stroke-current stroke-[1.6]" />
            </svg>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <RouterLink :to="seal.to" :data-theme="themed(seal.theme)" class="block rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_14%,var(--ui-bg))] p-5 text-[var(--ui-fg)] no-underline transition-all duration-150 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--ui-primary)_78%,var(--ui-border))]">
              <div class="flex items-start justify-between gap-4">
                <div class="flex gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ui-primary)_36%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_16%,transparent)] text-2xl text-[var(--ui-primary)]">{{ seal.glyph }}</div>
                  <div>
                    <h3 class="text-lg font-semibold tracking-[-0.04em]">{{ seal.title }}</h3>
                    <p class="mt-1 text-sm font-bold text-[var(--ui-primary)]">{{ seal.subtitle }}</p>
                    <p class="mt-3 text-sm text-[var(--ui-fg-muted)]">{{ seal.description }}</p>
                  </div>
                </div>
                <span class="text-xs font-black text-[var(--ui-primary)]">{{ seal.cta }} →</span>
              </div>
            </RouterLink>

            <RouterLink :to="armour.to" :data-theme="themed(armour.theme)" class="block rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_14%,var(--ui-bg))] p-5 text-[var(--ui-fg)] no-underline transition-all duration-150 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--ui-primary)_78%,var(--ui-border))]">
              <div class="flex items-start justify-between gap-4">
                <div class="flex gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ui-primary)_36%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_16%,transparent)] text-2xl text-[var(--ui-primary)]">{{ armour.glyph }}</div>
                  <div>
                    <h3 class="text-lg font-semibold tracking-[-0.04em]">{{ armour.title }}</h3>
                    <p class="mt-1 text-sm font-bold text-[var(--ui-primary)]">{{ armour.subtitle }}</p>
                    <p class="mt-3 text-sm text-[var(--ui-fg-muted)]">{{ armour.description }}</p>
                  </div>
                </div>
                <span class="text-xs font-black text-[var(--ui-primary)]">{{ armour.cta }} →</span>
              </div>
            </RouterLink>
          </div>

          <div class="relative hidden h-16 md:block">
            <svg class="absolute inset-0 h-full w-full overflow-visible text-[var(--ui-fg-muted)]" viewBox="0 0 800 80" preserveAspectRatio="none" aria-hidden="true">
              <path class="fill-none stroke-current stroke-[1.6] opacity-80" d="M200 0 C200 55 360 20 400 70" />
              <path class="fill-none stroke-current stroke-[1.6] opacity-80" d="M600 0 C600 55 440 20 400 70" />
              <path d="M400 70 l-7 -10 m7 10 l7 -10" class="fill-none stroke-current stroke-[1.6]" />
            </svg>
          </div>

          <RouterLink :to="identity.to" :data-theme="themed(identity.theme)" class="mx-auto block w-full max-w-xl rounded-2xl border border-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_14%,var(--ui-bg))] p-5 text-[var(--ui-fg)] no-underline transition-all duration-150 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--ui-primary)_78%,var(--ui-border))]">
            <div class="flex items-start justify-between gap-4">
              <div class="flex gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ui-primary)_36%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-primary)_16%,transparent)] text-2xl text-[var(--ui-primary)]">{{ identity.glyph }}</div>
                <div>
                  <h3 class="text-lg font-semibold tracking-[-0.04em]">{{ identity.title }}</h3>
                  <p class="mt-1 text-sm font-bold text-[var(--ui-primary)]">{{ identity.subtitle }}</p>
                  <p class="mt-3 text-sm text-[var(--ui-fg-muted)]">{{ identity.description }}</p>
                </div>
              </div>
              <span class="text-xs font-black text-[var(--ui-primary)]">{{ identity.cta }} →</span>
            </div>
          </RouterLink>
        </section>

        <section class="mx-auto mt-20 max-w-3xl rounded-3xl border border-[color:color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg)_88%,transparent)] p-8 text-center backdrop-blur md:p-10">
          <h2 class="text-3xl font-medium tracking-[0.05em]">Want signed-history architecture in your product?</h2>
          <p class="mx-auto mt-4 max-w-xl text-[var(--ui-fg-muted)]">
            I design local-first, replayable, verifiable systems from primitives and proof models to the runtime UI that makes them usable.
          </p>
          <div class="mt-7 flex justify-center">
            <a href="mailto:sam@ternent.dev" class="rounded-full bg-[var(--ui-primary)] px-5 py-3 text-sm font-medium text-[var(--ui-on-primary)] no-underline">Get in touch</a>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>
