<script setup lang="ts">
import { computed } from "vue";
import StickerFrame from "./StickerFrame.vue";
import StickerPixelArt from "./StickerPixelArt.vue";
import StickerKitArt from "./StickerKitArt.vue";

type GridArt = {
  kind: "grid";
  data: {
    creature: any;
    palettes: any[];
  };
};

type KitArt = {
  kind: "kit";
  data: {
    sticker: any;
    palettes?: any[];
    kitId?: string;
  };
};

type StickerProps = {
  art: GridArt | KitArt;
  rarity: string;
  size?: "compact" | "full";
  label?: string;
  sublabel?: string;
  status?: string;
  finish?: string;
  packId?: string;
  missing?: boolean;
};

const props = defineProps<StickerProps>();

const isCompact = computed(() => props.size === "compact");
const defaultLabel = computed(() => {
  if (props.label) return props.label;
  if (props.art.kind === "grid") return props.art.data.creature?.id || "";
  return props.art.data.sticker?.id || "";
});
const defaultSublabel = computed(() => {
  if (props.sublabel) return props.sublabel;
  if (props.art.kind === "grid") return props.art.data.creature?.rarity || "";
  return props.art.data.sticker?.rarity || "";
});
const seed = computed(() => {
  const base =
    props.art.kind === "grid"
      ? props.art.data.creature?.id
      : props.art.data.sticker?.id;
  const normalized = base || defaultLabel.value || defaultSublabel.value || props.rarity;
  return props.packId ? `${props.packId}:${normalized}` : normalized;
});
</script>

<template>
  <StickerFrame
    :rarity="rarity"
    :compact="isCompact"
    :label="defaultLabel"
    :sublabel="defaultSublabel"
    :status="status"
    :missing="missing"
    :seed="seed"
  >
    <StickerPixelArt
      v-if="art.kind === 'grid'"
      :creature="art.data.creature"
      :palettes="art.data.palettes"
      :finish="finish"
      :pack-id="packId"
      :missing="missing"
    />
    <StickerKitArt
      v-else
      :sticker="art.data.sticker"
      :palettes="art.data.palettes"
      :kit-id="art.data.kitId"
      :finish="finish"
      :pack-id="packId"
      :missing="missing"
    />
  </StickerFrame>
</template>
