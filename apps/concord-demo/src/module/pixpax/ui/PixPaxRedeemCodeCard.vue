<script setup lang="ts">
import { computed } from "vue";
import CanvasSticker16 from "../CanvasSticker16.vue";
import type { PixPaxCodeCardItem } from "../api/client";
import type { PackPalette16, StickerArt16 } from "../sticker-types";
import PixPaxLogoText from "./assets/PixPaxLogoText.svg?component";

const props = withDefaults(
  defineProps<{
    item: PixPaxCodeCardItem;
    art?: StickerArt16 | null;
    palette?: PackPalette16 | null;
    artScale?: number;
  }>(),
  {
    art: null,
    palette: null,
    artScale: 5,
  },
);

const qrDataUrl = computed(() => {
  const normalized = String(props.item?.qrSvg || "").trim();
  if (!normalized) return "";
  return `data:image/svg+xml;utf8,${encodeURIComponent(normalized)}`;
});

const kindLabel = computed(() => {
  if (props.item.kind === "pack") {
    return `Pack of ${props.item.count || 1}`;
  }
  return `${props.item.label || "?"}`;
});

function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
}
</script>

<template>
  <article
    class="bg-white text-black p-4 break-inside-avoid [page-break-inside:avoid]"
  >
    <div
      class="border-2 border-dashed border-gray-400 rounded-sm flex flex-col items-center justify-center w-64 mx-auto p-4 relative"
    >
      <PixPaxLogoText class="h-6 fill-black z-1" />

      <img
        v-if="qrDataUrl"
        :src="qrDataUrl"
        alt="Code card QR"
        class="w-full -my-2"
      />
      <!-- <CanvasSticker16
          v-if="art && palette"
          :art="art"
          :palette="palette"
          :scale="artScale"
          class="!size-10 bg-black opacity-100 mt-2 absolute top-0 right-6"
        /> -->

      <div class="flex flex-col relative items-center justify-center gap-1">
        <p class="text-[10px]">{{ item.collectionId }} {{ item.version }}</p>
        <p class="mb-2 text-sm uppercase">
          {{ item.label }}
        </p>

        <p
          class="font-thin tracking-loose text-sm bg-gray-100 px-3 py-1 rounded-full z-1"
        >
          {{ item.codeId }}
        </p>
        <p class="text-[12px]">Expires {{ formatDate(item.expiresAt) }}</p>
        <a :href="item.redeemUrl" class="text-[10px] break-all text-black">
          {{ item.redeemUrl }}
        </a>
      </div>
    </div>
  </article>
</template>
