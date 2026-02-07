<script setup lang="ts">
import { computed } from "vue";
import StickerFrame from "../stickerbook/StickerFrame.vue";
import type { PackPalette16, Sticker } from "./sticker-types";
import CanvasSticker16 from "./CanvasSticker16.vue";

type PixPaxStickerCardProps = {
  sticker: Sticker;
  palette: PackPalette16;
  compact?: boolean;
  missing?: boolean;
};

const props = withDefaults(defineProps<PixPaxStickerCardProps>(), {
  compact: true,
  missing: false,
});

const frameRarity = computed(() => {
  switch (props.sticker.meta.rarity) {
    case "legendary":
      return "mythic";
    case "epic":
      return "uncommon";
    default:
      return props.sticker.meta.rarity;
  }
});

const finish = computed(() => props.sticker.meta.finish);
const shiny = computed(() => finish.value !== "matte");
const finishLabel = computed(() => `${finish.value}${shiny.value ? " ✦" : ""}`);

const finishClass = computed(() => {
  if (props.missing) return "";
  if (finish.value === "holo") return "finish-holo";
  if (finish.value === "gold") return "finish-gold";
  if (finish.value === "silver") return "finish-silver";
  return "";
});

const displayLabel = computed(() =>
  props.missing ? "Unknown Sticker" : props.sticker.meta.name,
);
const displayStatus = computed(() =>
  props.missing ? "unowned" : props.sticker.meta.rarity,
);
</script>

<template>
  <div class="w-64">
    <StickerFrame
      :rarity="frameRarity"
      :compact="props.compact"
      :label="displayLabel"
      :sublabel="sticker.meta.collectionName"
      :status="displayStatus"
      :seed="sticker.meta.id"
      :missing="props.missing"
    >
      <div class="art-wrap">
        <CanvasSticker16
          :art="sticker.art"
          :palette="props.palette"
          :scale="18"
          :class="['mx-auto', props.missing ? 'art-missing' : '']"
        />
        <div
          v-if="finishClass"
          :class="['finish-overlay', finishClass]"
          aria-hidden="true"
        />
      </div>
    </StickerFrame>
  </div>
</template>
