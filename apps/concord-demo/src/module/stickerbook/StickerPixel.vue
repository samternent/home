<script setup lang="ts">
import { computed } from "vue";
import Sticker from "./Sticker.vue";

type PixelCreature = {
  id: string;
  seed: string;
  rarity: string;
  paletteId: string;
  attributes: {
    grid: string;
    gridSize: number;
    bg: number;
    symmetry: string;
  };
};

type Palette = {
  id: string;
  colors: string[];
};

const props = defineProps<{
  creature: PixelCreature;
  palettes: Palette[];
  finish?: string;
  packId?: string;
  missing?: boolean;
  compact?: boolean;
  status?: string;
}>();

const rarity = computed(() => props.creature?.rarity || "common");
</script>

<template>
  <Sticker
    :art="{ kind: 'grid', data: { creature, palettes } }"
    :rarity="rarity"
    :size="compact ? 'compact' : 'full'"
    :label="compact ? undefined : creature.id"
    :sublabel="compact ? undefined : creature.rarity"
    :status="compact ? undefined : status"
    :finish="finish"
    :pack-id="packId"
    :missing="missing"
  />
</template>
