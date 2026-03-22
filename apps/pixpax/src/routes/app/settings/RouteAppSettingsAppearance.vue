<script setup lang="ts">
import { Card } from "ternent-ui/primitives";
import { useThemeMode } from "@/modules/ui";

const theme = useThemeMode();
</script>

<template>
  <Card variant="showcase" padding="sm" class="space-y-5">
    <div class="space-y-1">
      <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Appearance</p>
      <h2 class="m-0 text-xl font-semibold">Stickerbook theme</h2>
      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        PixPax uses one fixed brand theme on every device. No switching, no system dark-mode changes, just the stickerbook look.
      </p>
    </div>

    <p class="m-0 text-sm text-[var(--ui-fg)]">
      Active theme: <span class="font-medium uppercase">{{ theme.mode.value }}</span>
    </p>
  </Card>
</template>
