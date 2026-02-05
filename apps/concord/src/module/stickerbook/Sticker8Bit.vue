<script setup lang="ts">
import { computed } from "vue";
import Sticker from "./Sticker.vue";

type Sticker8Bit = {
  id: string;
  seed: string;
  rarity: string;
  paletteId: string;
  attributes: {
    size: number;
    bodyId: string;
    eyesId: string;
    accessoryId?: string | null;
    frameId?: string | null;
    fxId?: string | null;
  };
};

type Palette = {
  id: string;
  colors: string[];
};

const props = defineProps<{
  sticker: Sticker8Bit;
  palettes?: Palette[];
  finish?: string;
  packId?: string;
  kitId?: string;
  missing?: boolean;
  compact?: boolean;
  status?: string;
}>();

const rarity = computed(() => props.sticker?.rarity || "common");
</script>

<template>
  <Sticker
    :art="{ kind: 'kit', data: { sticker, palettes, kitId } }"
    :rarity="rarity"
    :size="compact ? 'compact' : 'full'"
    :label="compact ? undefined : sticker.id"
    :sublabel="compact ? undefined : sticker.rarity"
    :status="compact ? undefined : status"
    :finish="finish"
    :pack-id="packId"
    :missing="missing"
  />
</template>
