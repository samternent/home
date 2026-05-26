<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Button } from "ternent-ui/primitives";
import { useThemeMode } from "@/modules/ui";

type IconName = "runtime" | "concord" | "ledger" | "seal" | "armour" | "identity";
type ThemeName = "aurora" | "concord" | "ledger" | "proof" | "armour";
type StackKey = "runtime" | "concord" | "ledger" | "seal" | "armour" | "identity";

type StackNode = {
  title: string;
  subtitle: string;
  question?: string;
  to: string;
  cta: string;
  icon: IconName;
  theme: ThemeName;
};

const { mode } = useThemeMode();
const rootThemeMode = ref<"light" | "dark" | null>(null);
const activeNode = ref<StackKey | null>(null);

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

const stack: Record<StackKey, StackNode> = {
  runtime: {
    title: "run.ternent.dev",
    subtitle: "Hosted runtime. Build, run, and replay applications.",
    to: "/concord",
    cta: "Open app",
    icon: "runtime",
    theme: "concord",
  },
  concord: {
    title: "@ternent/concord",
    subtitle: "Runtime layer. Interprets history and produces state.",
    question: "What does it mean when replayed?",
    to: "/concord",
    cta: "Explore",
    icon: "concord",
    theme: "concord",
  },
  ledger: {
    title: "@ternent/ledger",
    subtitle: "Append-only log. A signed record of what happened.",
    question: "What happened?",
    to: "/ledger",
    cta: "Explore",
    icon: "ledger",
    theme: "ledger",
  },
  seal: {
    title: "@ternent/seal",
    subtitle: "Signatures and attestations.",
    question: "Can we prove it?",
    to: "/seal",
    cta: "Explore",
    icon: "seal",
    theme: "proof",
  },
  armour: {
    title: "@ternent/armour",
    subtitle: "Encryption and access control.",
    question: "Who can read it?",
    to: "/armour",
    cta: "Explore",
    icon: "armour",
    theme: "armour",
  },
  identity: {
    title: "@ternent/identity",
    subtitle: "Identities and keys. The root of trust.",
    question: "Who acted?",
    to: "/settings/identity",
    cta: "Explore",
    icon: "identity",
    theme: "aurora",
  },
};

const iconPaths: Record<IconName, string[]> = {
  runtime: ["M8 8h3v3H8z", "M13 8h3v3h-3z", "M8 13h3v3H8z", "M13 13h3v3h-3z"],
  concord: ["M12 4.75l6.5 3.75v7.5L12 19.75 5.5 16V8.5z", "M12 9.25v.01", "M9.5 10.75v.01", "M14.5 10.75v.01", "M9.5 13.25v.01", "M14.5 13.25v.01"],
  ledger: ["M8 8.5h8", "M8 12h8", "M8 15.5h8", "M5.75 8.5h.01", "M5.75 12h.01", "M5.75 15.5h.01"],
  seal: ["M12 4.5l6.5 2.75v4.5c0 3.75-2.5 6.75-6.5 7.75-4-1-6.5-4-6.5-7.75v-4.5z"],
  armour: ["M8 11V9.5a4 4 0 0 1 8 0V11", "M7.25 11h9.5v7h-9.5z", "M12 13.75v1.75"],
  identity: ["M12 11.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z", "M6.25 18c.85-2.45 3.1-3.75 5.75-3.75s4.9 1.3 5.75 3.75"],
};

function isDotPath(path: string) {
  return path.endsWith(".01");
}

function themed(theme: ThemeName) {
  return `${theme}-${activeMode.value}`;
}

function setActiveNode(key: StackKey | null) {
  activeNode.value = key;
}

function wireTone(keys: StackKey[]) {
  const isActive = activeNode.value ? keys.includes(activeNode.value) : true;
  return isActive ? "opacity-80" : "opacity-20";
}

const nodeBaseClass =
  "grid grid-cols-[auto_1fr_auto] items-center gap-5 rounded-xl border border-[color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-bg)_92%,transparent)] px-6 py-6 text-[var(--ui-fg)] no-underline shadow-[var(--ui-shadow-sm)] transition-all duration-150 ease-out hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--ui-primary)_78%,var(--ui-border))] hover:shadow-[var(--ui-shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ui-ring)]";

const lineBaseClass = "bg-current transition-all duration-200";
</script>

<template>
  <main class="relative mx-auto flex flex-col py-5 lg:gap-10">
    <div class="pointer-events-none absolute inset-0 -z-10 opacity-60">
      <div class="h-full w-full bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--ui-primary)_14%,transparent),transparent_58%)]" />
    </div>

    <div class="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6">
      <section class="px-6 py-10 text-center lg:px-12">
        <h1 class="mx-auto mt-3 max-w-4xl text-balance text-[clamp(2rem,4.6vw,3.85rem)] font-semibold tracking-[-0.022em] text-[var(--ui-fg)]">Software built on signed history.</h1>
        <p class="mx-auto mt-3 max-w-3xl text-balance text-[clamp(1rem,1.7vw,1.45rem)] font-normal leading-[1.45] text-[var(--ui-fg-muted)]">
          Deterministic replay, portable identity, and verifiable state for local-first applications.
        </p>

        <!-- <div class="mt-7 flex flex-wrap items-center justify-center gap-3"> -->
          <!-- <Button as="RouterLink" to="/concord" variant="secondary" size="md">Launch Runtime</Button> -->
          <!-- <RouterLink to="#architecture" class="inline-flex h-11 items-center rounded-lg border border-[color:color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-bg)_96%,transparent)] px-5 text-[0.95rem] font-medium text-[var(--ui-fg)] no-underline transition-colors hover:border-[color:color-mix(in_srgb,var(--ui-primary)_72%,var(--ui-border))]">
            Explore the Architecture
          </RouterLink> -->
        <!-- </div> -->

        <div class="mx-auto mt-7 hidden max-w-4xl items-center justify-center gap-4 text-[0.94rem] text-[var(--ui-fg-muted)] md:flex">
          <span>Commands produce entries.</span>
          <span class="h-4 w-px bg-[color:color-mix(in_srgb,var(--ui-border)_80%,transparent)]" />
          <span>Commits define history.</span>
          <span class="h-4 w-px bg-[color:color-mix(in_srgb,var(--ui-border)_80%,transparent)]" />
          <span>State is rebuilt through replay.</span>
        </div>
      </section>

      <section id="architecture" class="grid gap-8 p-3 lg:p-5">
        <div class="overflow-x-auto">
          <div class="hidden min-w-[54rem] flex-col items-center lg:flex">
            <RouterLink
              :to="stack.runtime.to"
              :data-theme="themed(stack.runtime.theme)"
              :class="[nodeBaseClass, 'w-[52rem]']"
              @mouseenter="setActiveNode('runtime')"
              @mouseleave="setActiveNode(null)"
            >
              <span class="grid h-12 w-12 place-items-center rounded-[10px] border border-[color-mix(in_srgb,var(--ui-primary)_68%,var(--ui-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-primary)_92%,transparent),color-mix(in_srgb,var(--ui-primary-active)_88%,transparent))] text-[var(--ui-on-primary)]" aria-hidden="true">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path
                    v-for="path in iconPaths[stack.runtime.icon]"
                    :key="path"
                    :d="path"
                    :stroke="isDotPath(path) ? 'none' : 'currentColor'"
                    :fill="isDotPath(path) ? 'currentColor' : 'none'"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="min-w-0">
                <strong class="m-0 block text-[1.08rem] font-medium tracking-[-0.01em]">{{ stack.runtime.title }}</strong>
                <em class="mt-1 block text-[0.92rem] font-normal not-italic text-[var(--ui-fg-muted)]">{{ stack.runtime.subtitle }}</em>
              </span>
              <span class="whitespace-nowrap text-[0.92rem] font-medium text-[var(--ui-primary)]">{{ stack.runtime.cta }} →</span>
            </RouterLink>

            <div :data-theme="themed('concord')" class="flex h-11 items-center text-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))]">
              <div :class="[lineBaseClass, wireTone(['runtime', 'concord']), 'h-11 w-px']" />
            </div>

            <RouterLink
              :to="stack.concord.to"
              :data-theme="themed(stack.concord.theme)"
              :class="[nodeBaseClass, 'w-[52rem]']"
              @mouseenter="setActiveNode('concord')"
              @mouseleave="setActiveNode(null)"
            >
              <span class="grid h-12 w-12 place-items-center rounded-[10px] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_52%,var(--ui-bg))] text-[var(--ui-primary)]" aria-hidden="true">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"><path v-for="path in iconPaths[stack.concord.icon]" :key="path" :d="path" :stroke="isDotPath(path) ? 'none' : 'currentColor'" :fill="isDotPath(path) ? 'currentColor' : 'none'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              <span class="min-w-0"><strong class="m-0 block text-[1.08rem] font-medium tracking-[-0.01em]">{{ stack.concord.title }}</strong><em class="mt-1 block text-[0.92rem] font-normal not-italic text-[var(--ui-fg-muted)]">{{ stack.concord.subtitle }}</em><span class="mt-1 block text-[0.82rem] font-normal text-[var(--ui-primary)]">{{ stack.concord.question }}</span></span>
              <span class="whitespace-nowrap text-[0.92rem] font-medium text-[var(--ui-primary)]">{{ stack.concord.cta }} →</span>
            </RouterLink>

            <div :data-theme="themed('ledger')" class="flex h-11 items-center text-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))]">
              <div :class="[lineBaseClass, wireTone(['runtime', 'concord', 'ledger']), 'h-11 w-px']" />
            </div>

            <RouterLink
              :to="stack.ledger.to"
              :data-theme="themed(stack.ledger.theme)"
              :class="[nodeBaseClass, 'w-[52rem]']"
              @mouseenter="setActiveNode('ledger')"
              @mouseleave="setActiveNode(null)"
            >
              <span class="grid h-12 w-12 place-items-center rounded-[10px] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_52%,var(--ui-bg))] text-[var(--ui-primary)]" aria-hidden="true">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"><path v-for="path in iconPaths[stack.ledger.icon]" :key="path" :d="path" :stroke="isDotPath(path) ? 'none' : 'currentColor'" :fill="isDotPath(path) ? 'currentColor' : 'none'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              <span class="min-w-0"><strong class="m-0 block text-[1.08rem] font-medium tracking-[-0.01em]">{{ stack.ledger.title }}</strong><em class="mt-1 block text-[0.92rem] font-normal not-italic text-[var(--ui-fg-muted)]">{{ stack.ledger.subtitle }}</em><span class="mt-1 block text-[0.82rem] font-normal text-[var(--ui-primary)]">{{ stack.ledger.question }}</span></span>
              <span class="whitespace-nowrap text-[0.92rem] font-medium text-[var(--ui-primary)]">{{ stack.ledger.cta }} →</span>
            </RouterLink>

            <div class="relative h-14 w-[52rem]">
              <div :data-theme="themed('ledger')" class="absolute inset-0 text-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))]">
                <div :class="[lineBaseClass, wireTone(['concord', 'ledger']), 'absolute left-1/2 top-0 h-5 w-px -translate-x-1/2']" />
                <div :class="[lineBaseClass, wireTone(['ledger', 'seal', 'armour']), 'absolute left-[12.625rem] right-[12.625rem] top-5 h-px']" />
              </div>
              <div :data-theme="themed('proof')" class="absolute inset-0 text-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))]">
                <div :class="[lineBaseClass, wireTone(['ledger', 'seal']), 'absolute left-[12.625rem] top-5 h-9 w-px']" />
              </div>
              <div :data-theme="themed('armour')" class="absolute inset-0 text-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))]">
                <div :class="[lineBaseClass, wireTone(['ledger', 'armour']), 'absolute right-[12.625rem] top-5 h-9 w-px']" />
              </div>
            </div>

            <div class="flex w-[52rem] justify-between">
              <RouterLink
                :to="stack.seal.to"
                :data-theme="themed(stack.seal.theme)"
                :class="[nodeBaseClass, 'w-[25.25rem]']"
                @mouseenter="setActiveNode('seal')"
                @mouseleave="setActiveNode(null)"
              >
                <span class="grid h-12 w-12 place-items-center rounded-[10px] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_52%,var(--ui-bg))] text-[var(--ui-primary)]" aria-hidden="true">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"><path v-for="path in iconPaths[stack.seal.icon]" :key="path" :d="path" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </span>
                <span class="min-w-0"><strong class="m-0 block text-[1.08rem] font-medium tracking-[-0.01em]">{{ stack.seal.title }}</strong><em class="mt-1 block text-[0.92rem] font-normal not-italic text-[var(--ui-fg-muted)]">{{ stack.seal.subtitle }}</em><span class="mt-1 block text-[0.82rem] font-normal text-[var(--ui-primary)]">{{ stack.seal.question }}</span></span>
                <span class="whitespace-nowrap text-[0.92rem] font-medium text-[var(--ui-primary)]">{{ stack.seal.cta }} →</span>
              </RouterLink>

              <RouterLink
                :to="stack.armour.to"
                :data-theme="themed(stack.armour.theme)"
                :class="[nodeBaseClass, 'w-[25.25rem]']"
                @mouseenter="setActiveNode('armour')"
                @mouseleave="setActiveNode(null)"
              >
                <span class="grid h-12 w-12 place-items-center rounded-[10px] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_52%,var(--ui-bg))] text-[var(--ui-primary)]" aria-hidden="true">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"><path v-for="path in iconPaths[stack.armour.icon]" :key="path" :d="path" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </span>
                <span class="min-w-0"><strong class="m-0 block text-[1.08rem] font-medium tracking-[-0.01em]">{{ stack.armour.title }}</strong><em class="mt-1 block text-[0.92rem] font-normal not-italic text-[var(--ui-fg-muted)]">{{ stack.armour.subtitle }}</em><span class="mt-1 block text-[0.82rem] font-normal text-[var(--ui-primary)]">{{ stack.armour.question }}</span></span>
                <span class="whitespace-nowrap text-[0.92rem] font-medium text-[var(--ui-primary)]">{{ stack.armour.cta }} →</span>
              </RouterLink>
            </div>

            <div class="relative h-14 w-[52rem]">
              <div :data-theme="themed('proof')" class="absolute inset-0 text-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))]">
                <div :class="[lineBaseClass, wireTone(['seal', 'identity']), 'absolute left-[12.625rem] top-0 h-7 w-px']" />
              </div>
              <div :data-theme="themed('armour')" class="absolute inset-0 text-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))]">
                <div :class="[lineBaseClass, wireTone(['armour', 'identity']), 'absolute right-[12.625rem] top-0 h-7 w-px']" />
              </div>
              <div :data-theme="themed('aurora')" class="absolute inset-0 text-[color:color-mix(in_srgb,var(--ui-primary)_58%,var(--ui-border))]">
                <div :class="[lineBaseClass, wireTone(['seal', 'armour', 'identity']), 'absolute left-[12.625rem] right-[12.625rem] top-7 h-px']" />
                <div :class="[lineBaseClass, wireTone(['seal', 'armour', 'identity']), 'absolute left-1/2 top-7 h-7 w-px -translate-x-1/2']" />
              </div>
            </div>

            <RouterLink
              :to="stack.identity.to"
              :data-theme="themed(stack.identity.theme)"
              :class="[nodeBaseClass, 'w-[52rem]']"
              @mouseenter="setActiveNode('identity')"
              @mouseleave="setActiveNode(null)"
            >
              <span class="grid h-12 w-12 place-items-center rounded-[10px] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_52%,var(--ui-bg))] text-[var(--ui-primary)]" aria-hidden="true">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"><path v-for="path in iconPaths[stack.identity.icon]" :key="path" :d="path" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
              <span class="min-w-0"><strong class="m-0 block text-[1.08rem] font-medium tracking-[-0.01em]">{{ stack.identity.title }}</strong><em class="mt-1 block text-[0.92rem] font-normal not-italic text-[var(--ui-fg-muted)]">{{ stack.identity.subtitle }}</em><span class="mt-1 block text-[0.82rem] font-normal text-[var(--ui-primary)]">{{ stack.identity.question }}</span></span>
              <span class="whitespace-nowrap text-[0.92rem] font-medium text-[var(--ui-primary)]">{{ stack.identity.cta }} →</span>
            </RouterLink>

            <!-- <div class="mt-5 flex w-[52rem] items-center justify-between border-t border-[color:color-mix(in_srgb,var(--ui-border)_82%,transparent)] pt-3 text-[0.88rem] text-[var(--ui-fg-muted)]">
              <p class="m-0">Everything above is open source</p>
              <a href="https://github.com/samternent/home" target="_blank" rel="noreferrer" class="font-medium text-[var(--ui-primary)] no-underline">View on GitHub ↗</a>
            </div> -->
          </div>

          <div class="grid gap-4 lg:hidden">
            <RouterLink
              v-for="(node, key) in stack"
              :key="key"
              :to="node.to"
              :data-theme="themed(node.theme)"
              :class="nodeBaseClass"
            >
              <span class="grid h-11 w-11 place-items-center rounded-[10px] border border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary-muted)_52%,var(--ui-bg))] text-[var(--ui-primary)]" aria-hidden="true">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path
                    v-for="path in iconPaths[node.icon]"
                    :key="path"
                    :d="path"
                    :stroke="isDotPath(path) ? 'none' : 'currentColor'"
                    :fill="isDotPath(path) ? 'currentColor' : 'none'"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="min-w-0"><strong class="m-0 block text-[1.02rem] font-medium tracking-[-0.01em]">{{ node.title }}</strong><em class="mt-1 block text-[0.9rem] font-normal not-italic text-[var(--ui-fg-muted)]">{{ node.subtitle }}</em><span v-if="node.question" class="mt-1 block text-[0.82rem] font-normal text-[var(--ui-primary)]">{{ node.question }}</span></span>
              <span class="whitespace-nowrap text-[0.9rem] font-medium text-[var(--ui-primary)]">{{ node.cta }} →</span>
            </RouterLink>

            <div class="mt-2 flex items-center justify-between border-t border-[color:color-mix(in_srgb,var(--ui-border)_82%,transparent)] pt-3 text-[0.84rem] text-[var(--ui-fg-muted)]">
              <p class="m-0">Everything above is open source</p>
              <a href="https://github.com/samternent/home" target="_blank" rel="noreferrer" class="font-medium text-[var(--ui-primary)] no-underline">GitHub ↗</a>
            </div>
          </div>
        </div>
      </section>
    </div>

  </main>
</template>
