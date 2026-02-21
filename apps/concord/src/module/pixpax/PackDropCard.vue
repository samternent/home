<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "ternent-ui/primitives";

type PackDropCardProps = {
  primaryAction?: "open-pack" | "redeem-code";
  ctaLabel: string;
  ctaSubtext?: string;
  ctaDisabled?: boolean;
  ctaChip?: string | null;
  canRedeem?: boolean;
  redeemPlaceholder?: string;
  redeemMinLength?: number;
  prefillCode?: string;
  onOpenPack: () => void | Promise<void>;
  onRedeemCode: (code: string) => Promise<void>;
  showDevOptions?: boolean;
};

const props = withDefaults(defineProps<PackDropCardProps>(), {
  primaryAction: "open-pack",
  ctaSubtext: "",
  ctaDisabled: false,
  ctaChip: null,
  canRedeem: true,
  redeemPlaceholder: "payload.signature",
  redeemMinLength: 24,
  prefillCode: "",
  showDevOptions: false,
});

const redeemOpen = ref(false);
const devOpen = ref(false);
const redeemInput = ref("");
const redeemError = ref("");
const redeemSuccess = ref("");
const redeemBusy = ref(false);

function normalizeToken(value: string) {
  return String(value || "").trim();
}

watch(
  () => props.prefillCode,
  (next) => {
    const normalized = normalizeToken(next);
    if (!redeemInput.value && normalized) {
      redeemInput.value = normalized;
    }
  },
  { immediate: true },
);

const normalizedRedeemCode = computed(() => normalizeToken(redeemInput.value));
const redeemValid = computed(
  () => normalizedRedeemCode.value.length >= props.redeemMinLength,
);

function handleRedeemInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const nextValue = normalizeToken(target?.value || "");
  redeemInput.value = nextValue;
  redeemError.value = "";
  redeemSuccess.value = "";
}

async function redeemCode() {
  if (!redeemValid.value || redeemBusy.value || !props.canRedeem) return;
  redeemBusy.value = true;
  redeemError.value = "";
  redeemSuccess.value = "";
  try {
    await props.onRedeemCode(normalizedRedeemCode.value);
    redeemOpen.value = false;
    redeemInput.value = "";
    redeemSuccess.value = "Token redeemed.";
  } catch (error: any) {
    redeemError.value = error?.message || "Redeem failed.";
  } finally {
    redeemBusy.value = false;
  }
}

async function handlePrimaryAction() {
  if (props.primaryAction === "redeem-code") {
    redeemOpen.value = true;
    redeemError.value = "";
    redeemSuccess.value = "";
    return;
  }
  await props.onOpenPack();
}
</script>

<template>
  <section
    class="w-full max-w-[560px] mx-auto rounded-[20px] backdrop-blur-xl px-4 py-4 sm:px-6"
  >
    <div class="flex flex-col gap-3">
      <button
        class="group relative flex w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-full border-2 border-[var(--ui-border)] bg-[var(--ui-accent)] px-6 py-3 text-left text-sm font-semibold text-[var(--ui-fg-on-accent)] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_36px_-24px_rgba(0,0,0,0.75)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto packdrop-shimmer"
        :disabled="props.ctaDisabled"
        @click="handlePrimaryAction"
      >
        <span
          class="relative z-10 flex items-center gap-2 text-[var(--ui-on-accent)]"
        >
          {{ props.ctaLabel }}
        </span>
        <span
          v-if="props.ctaSubtext"
          class="relative z-10 text-[11px] font-normal tracking-[0.08em] text-[var(--ui-on-accent)]"
        >
          {{ props.ctaSubtext }}
        </span>
      </button>

      <div class="flex flex-col gap-2">
        <button
          class="flex h-10 items-center justify-between rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)]/30 px-4 text-xs uppercase tracking-[0.2em] text-[var(--ui-fg-muted)] transition hover:text-[var(--ui-fg)]"
          type="button"
          :aria-expanded="redeemOpen"
          @click="redeemOpen = !redeemOpen"
        >
          <span>Redeem token</span>
          <span class="text-base leading-none">
            {{ redeemOpen ? "▾" : "▸" }}
          </span>
        </button>

        <div
          class="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
          :class="redeemOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'"
        >
          <div class="flex flex-col gap-2 pt-2">
            <label class="sr-only" for="redeem-code">Token</label>
            <div class="flex flex-col gap-2 sm:flex-row">
              <input
                id="redeem-code"
                class="flex h-11 w-full rounded-full border border-[var(--ui-border)] bg-transparent px-4 text-xs font-mono text-[var(--ui-fg)] placeholder:text-[var(--ui-fg-muted)]"
                :placeholder="props.redeemPlaceholder"
                :value="redeemInput"
                autocomplete="off"
                spellcheck="false"
                @input="handleRedeemInput"
              />
              <Button
                class="h-11 w-full sm:w-auto"
                size="sm"
                variant="secondary"
                :disabled="!redeemValid || redeemBusy || !props.canRedeem"
                @click="redeemCode"
              >
                Redeem
              </Button>
            </div>
            <p v-if="redeemError" class="text-xs text-red-500">
              {{ redeemError }}
            </p>
          </div>
        </div>

        <p v-if="redeemSuccess" class="text-xs text-[var(--ui-fg-muted)]">
          {{ redeemSuccess }}
        </p>
      </div>

      <div v-if="props.showDevOptions" class="pt-2">
        <button
          class="flex h-9 w-full items-center justify-between rounded-full border border-dashed border-[var(--ui-border)] px-4 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
          type="button"
          :aria-expanded="devOpen"
          @click="devOpen = !devOpen"
        >
          <span>Dev options</span>
          <span class="text-base leading-none">{{ devOpen ? "▾" : "▸" }}</span>
        </button>
        <div v-if="devOpen" class="mt-3 flex flex-col gap-2">
          <slot name="dev-options" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.packdrop-shimmer::before {
  content: "";
  position: absolute;
  inset: -200%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 244, 194, 0.6) 60deg,
    rgba(246, 242, 215, 0.5) 120deg,
    rgba(255, 239, 154, 0.6) 180deg,
    transparent 240deg
  );
  opacity: 0.45;
  filter: blur(2px);
  animation: packdrop-shimmer-spin 5s linear infinite;
  pointer-events: none;
}

@keyframes packdrop-shimmer-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
