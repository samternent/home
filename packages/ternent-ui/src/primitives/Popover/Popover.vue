<script setup lang="ts">
import { Popover as ArkPopover } from "@ark-ui/vue/popover";
import { computed, useSlots } from "vue";
import { popoverProps } from "./Popover.props";
import {
  popoverArrowClass,
  popoverBodyClass,
  popoverCloseClass,
  popoverContentClass,
  popoverDescriptionClass,
  popoverFooterClass,
  popoverHeaderClass,
  popoverPositionerClass,
  popoverTitleClass,
} from "./Popover.variants";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps(popoverProps);
const slots = useSlots();

const hasHeader = computed(
  () => Boolean(props.title || props.description || slots.header || props.showClose),
);
</script>

<template>
  <ArkPopover.Root
    v-model:open="open"
    :positioning="{ placement: props.placement }"
  >
    <ArkPopover.Trigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </ArkPopover.Trigger>
    <ArkPopover.Positioner :class="popoverPositionerClass">
      <ArkPopover.Content :class="popoverContentClass">
        <ArkPopover.Arrow v-if="props.showArrow" :class="popoverArrowClass">
          <ArkPopover.ArrowTip />
        </ArkPopover.Arrow>

        <div v-if="hasHeader" :class="popoverHeaderClass">
          <slot name="header">
            <div class="min-w-0 flex-1">
              <ArkPopover.Title v-if="props.title" :class="popoverTitleClass">
                {{ props.title }}
              </ArkPopover.Title>
              <ArkPopover.Description
                v-if="props.description"
                :class="popoverDescriptionClass"
              >
                {{ props.description }}
              </ArkPopover.Description>
            </div>
          </slot>
          <ArkPopover.CloseTrigger
            v-if="props.showClose"
            :class="popoverCloseClass"
            aria-label="Close popover"
          >
            <svg viewBox="0 0 24 24" fill="none" class="size-4" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
              />
            </svg>
          </ArkPopover.CloseTrigger>
        </div>

        <div :class="popoverBodyClass">
          <slot />
        </div>

        <div v-if="$slots.footer" :class="popoverFooterClass">
          <slot name="footer" />
        </div>
      </ArkPopover.Content>
    </ArkPopover.Positioner>
  </ArkPopover.Root>
</template>
