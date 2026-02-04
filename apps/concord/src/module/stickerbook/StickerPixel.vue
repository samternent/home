<script setup lang="ts">
defineProps<{
  creature?: any;
  palettes?: any[];
  finish?: string;
  packId?: string;
  missing?: boolean;
  compact?: boolean;
  verified?: boolean;
}>();
</script>

<template>
  <div class="sticker-card" :class="{ compact, missing }">
    <div class="sticker-title">
      {{ creature?.name || creature?.id || "Pixel Sticker" }}
    </div>
    <div class="sticker-meta">
      <span v-if="finish">Finish: {{ finish }}</span>
      <span v-if="palettes?.length">Palette: {{ palettes[0]?.id || "base" }}</span>
      <span v-if="verified !== undefined">
        {{ verified ? "Verified" : "Unverified" }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.sticker-card {
  border: 2px solid rgba(15, 23, 42, 0.2);
  border-radius: 12px;
  padding: 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.sticker-card.compact {
  padding: 0.5rem;
}

.sticker-card.missing {
  opacity: 0.4;
}

.sticker-title {
  font-weight: 700;
}

.sticker-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: #475569;
}
</style>
