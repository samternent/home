<script setup lang="ts">
import { Tooltip as ArkTooltip } from "@ark-ui/vue/tooltip";
import { tooltipProps } from "./Tooltip.props";
import {
  tooltipArrowClass,
  tooltipContentClass,
  tooltipPositionerClass,
} from "./Tooltip.variants";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps(tooltipProps);
</script>

<template>
  <ArkTooltip.Root
    v-model:open="open"
    :open-delay="props.openDelay"
    :close-delay="props.closeDelay"
    :positioning="{ placement: props.placement }"
    lazy-mount
    unmount-on-exit
  >
    <ArkTooltip.Trigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </ArkTooltip.Trigger>
    <ArkTooltip.Positioner :class="tooltipPositionerClass">
      <ArkTooltip.Content :class="tooltipContentClass">
        <slot />
        <ArkTooltip.Arrow v-if="props.showArrow" :class="tooltipArrowClass">
          <ArkTooltip.ArrowTip />
        </ArkTooltip.Arrow>
      </ArkTooltip.Content>
    </ArkTooltip.Positioner>
  </ArkTooltip.Root>
</template>
