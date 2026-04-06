<script setup lang="ts">
import { computed } from "vue";
import { Dialog } from "ternent-ui/primitives";
import RunExplorerPanel from "@/modules/ui/components/RunExplorerPanel.vue";
import { useAppShellState } from "@/modules/ui/useAppShellState";

const shellState = useAppShellState();

const open = computed({
  get: () => shellState.activePanel.value === "explorer",
  set: (value: boolean) => {
    if (!value) {
      shellState.closePanel();
    }
  },
});
</script>

<template>
  <Dialog
    v-model:open="open"
    size="xl"
    :show-close="false"
    :close-on-interact-outside="true"
  >
    <div class="-m-4 flex h-[min(42rem,calc(100dvh-3rem))] min-h-0 flex-col overflow-hidden">
      <div class="min-h-0 flex-1 overflow-auto">
        <RunExplorerPanel />
      </div>
    </div>
  </Dialog>
</template>
