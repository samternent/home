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
  props.missing ? "Unknown Sticker" : props.sticker.meta.name
);
const displayStatus = computed(() =>
  props.missing ? "unowned" : props.sticker.meta.rarity
);
</script>

<template>
  <div class="sticker-card">
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
          :scale="8"
          :class="['mx-auto', props.missing ? 'art-missing' : '']"
        />
        <div
          v-if="finishClass"
          :class="['finish-overlay', finishClass]"
          aria-hidden="true"
        />
      </div>
    </StickerFrame>
    <div class="meta-row">
      <span class="chip">{{ props.missing ? "mystery" : sticker.meta.rarity }}</span>
      <span class="chip">{{ props.missing ? "locked" : finishLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.sticker-card {
  display: grid;
  gap: 6px;
}

.art-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
  min-height: 138px;
}

.art-missing {
  filter: grayscale(1) saturate(0.1);
  opacity: 0.26;
}

.finish-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 8px;
}

.finish-holo {
  background: linear-gradient(
    120deg,
    transparent 20%,
    color-mix(in srgb, var(--ui-primary) 32%, transparent) 42%,
    color-mix(in srgb, var(--ui-secondary) 34%, transparent) 58%,
    transparent 80%
  );
  animation: holo-shift 2.8s linear infinite;
}

.finish-gold {
  background: linear-gradient(
    135deg,
    transparent,
    rgba(255, 208, 84, 0.3),
    transparent
  );
}

.finish-silver {
  background: linear-gradient(
    135deg,
    transparent,
    rgba(210, 220, 230, 0.34),
    transparent
  );
}

.meta-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.chip {
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  padding: 2px 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ui-fg-muted);
}

@keyframes holo-shift {
  0% {
    transform: translateX(-18%);
  }
  100% {
    transform: translateX(18%);
  }
}
</style>
