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
  <IdentityAvatar :identity="item" size="xs" class="mx-auto" />
</template>
