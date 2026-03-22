<script setup lang="ts">
import { computed } from "vue";
import { formatRedeemCode } from "@/modules/redeem/code-format";
import PixpaxLogoText from "@/modules/ui/components/PixpaxLogoText.vue";

const props = defineProps<{
  item: {
    label: string;
    codeId: string;
    redeemUrl: string;
    qrSvg: string;
    collectionId: string;
    version: string;
    expiresAt: string;
  };
}>();

const qrMarkup = computed(() => String(props.item.qrSvg || "").trim());

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
</script>

<template>
  <article class="break-inside-avoid [page-break-inside:avoid]">
    <div class="mx-auto flex w-full max-w-[18rem] flex-col items-center gap-3 rounded-[1.6rem] border border-[rgba(255,255,255,0.22)] bg-white px-4 py-5 text-center text-black shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <PixpaxLogoText class="h-6 w-auto" />

      <div
        v-if="qrMarkup"
        class="flex w-full items-center justify-center"
        v-html="qrMarkup"
      />

      <div class="space-y-1">
        <p class="m-0 text-[10px] uppercase tracking-[0.18em] text-black/55">
          {{ item.collectionId }} / {{ item.version }}
        </p>
        <p class="m-0 font-mono text-base uppercase tracking-[0.08em]">
          {{ item.label }}
        </p>
      </div>

      <p class="m-0 rounded-full bg-black/6 px-3 py-1 font-mono text-sm tracking-[0.08em]">
        {{ formatRedeemCode(item.codeId) }}
      </p>
      <p class="m-0 text-[11px] text-black/65">
        Expires {{ formatDate(item.expiresAt) }}
      </p>
      <p class="m-0 break-all text-[10px] text-black/55">
        {{ item.redeemUrl }}
      </p>
    </div>
  </article>
</template>
