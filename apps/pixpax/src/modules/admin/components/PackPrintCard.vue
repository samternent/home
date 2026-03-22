<script setup lang="ts">
import { computed } from "vue";
import { formatRedeemCode } from "@/modules/redeem/code-format";
import type { PackPrintCardModel } from "@/modules/admin/print/mapGeneratedPackToPrintModel";
import { PACK_PRINT_PREVIEW_SCALE } from "@/modules/admin/print/print-config";
import PixpaxLogoText from "@/modules/ui/components/PixpaxLogoText.vue";

const props = withDefaults(
  defineProps<{
    model: PackPrintCardModel;
    preview?: boolean;
  }>(),
  {
    preview: false,
  },
);

const qrMarkup = computed(() => String(props.model.qrSvg || "").trim());
const previewStyle = computed(() => {
  if (!props.preview) {
    return {
      width: `${props.model.dimensions.width}px`,
      height: `${props.model.dimensions.height}px`,
    };
  }

  return {
    width: `${Math.round(props.model.dimensions.width * PACK_PRINT_PREVIEW_SCALE)}px`,
    height: `${Math.round(props.model.dimensions.height * PACK_PRINT_PREVIEW_SCALE)}px`,
  };
});

const contentStyle = computed(() => {
  const scale = props.preview ? PACK_PRINT_PREVIEW_SCALE : 1;
  return {
    width: `${props.model.dimensions.width}px`,
    height: `${props.model.dimensions.height}px`,
    transform: props.preview ? `scale(${scale})` : "none",
    transformOrigin: "top left",
  };
});
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.14)]"
    :style="previewStyle"
  >
    <article
      class="flex flex-col overflow-hidden rounded-[28px] border border-[rgba(28,34,54,0.34)] bg-white text-black"
      :data-pack-print-id="model.id"
      :style="contentStyle"
    >
      <div
        class="flex h-full flex-col items-center text-center"
        :style="{ padding: `${model.dimensions.safeInset}px` }"
      >
        <PixpaxLogoText class="h-12 w-auto text-black" />

        <div
          v-if="qrMarkup"
          class="mt-8 flex w-full flex-1 items-start justify-center"
          v-html="qrMarkup"
        />
        <div
          v-else
          class="mt-8 flex h-[360px] w-[360px] max-w-full items-center justify-center rounded-[22px] border border-dashed border-black/25 text-center text-[18px] text-black/55"
        >
          QR unavailable
        </div>

        <div class="mt-8 space-y-2">
          <p class="m-0 text-[22px] tracking-[0.04em] text-black/60">
            {{ model.metadataLine }}
          </p>
          <p class="m-0 font-mono text-[42px] uppercase tracking-[0.08em]">
            {{ model.packName }}
          </p>
        </div>

        <p class="m-0 mt-8 rounded-full bg-black/6 px-8 py-3 font-mono text-[32px] uppercase tracking-[0.08em]">
          {{ formatRedeemCode(model.shortCode) }}
        </p>

        <p class="m-0 mt-8 text-[26px] text-black/72">
          Scan to open in PixPax
        </p>
        <p class="m-0 mt-4 break-all text-[20px] leading-[1.45] text-black/65">
          {{ model.openUrl || "Open link unavailable" }}
        </p>
      </div>
    </article>
  </div>
</template>
