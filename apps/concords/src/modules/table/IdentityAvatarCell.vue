<script setup lang="ts">
import { IdentityAvatar } from "@/modules/identity";

defineProps({
  item: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <VTooltip :text="item" location="bottom">
    <template v-slot:activator="{ props }">
      <IdentityAvatar v-bind="props" :identity="item" size="sm" class="mx-2" />
    </template>
  </VTooltip>
</template>
