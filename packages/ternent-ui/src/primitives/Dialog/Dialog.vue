<script setup lang="ts">
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";
import { computed, useSlots } from "vue";
import { dialogProps } from "./Dialog.props";
import {
  dialogBackdropClass,
  dialogBodyClass,
  dialogCloseClass,
  dialogContentBaseClass,
  dialogContentSizeClasses,
  dialogDescriptionClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogPositionerClass,
  dialogTitleClass,
} from "./Dialog.variants";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps(dialogProps);
const slots = useSlots();

const hasHeader = computed(
  () => Boolean(props.title || props.description || slots.header || props.showClose),
);
</script>

<template>
  <ArkDialog.Root
    v-model:open="open"
    :close-on-escape="props.closeOnEscape"
    :close-on-interact-outside="props.closeOnInteractOutside"
    lazy-mount
    unmount-on-exit
  >
    <ArkDialog.Trigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </ArkDialog.Trigger>
    <ArkDialog.Backdrop :class="dialogBackdropClass" />
    <ArkDialog.Positioner :class="dialogPositionerClass">
      <ArkDialog.Content
        :class="[dialogContentBaseClass, dialogContentSizeClasses[props.size]]"
      >
        <div v-if="hasHeader" :class="dialogHeaderClass">
          <slot name="header">
            <div class="min-w-0 flex-1">
              <ArkDialog.Title v-if="props.title" :class="dialogTitleClass">
                {{ props.title }}
              </ArkDialog.Title>
              <ArkDialog.Description
                v-if="props.description"
                :class="dialogDescriptionClass"
              >
                {{ props.description }}
              </ArkDialog.Description>
            </div>
          </slot>
          <ArkDialog.CloseTrigger
            v-if="props.showClose"
            :class="dialogCloseClass"
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" fill="none" class="size-4" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
              />
            </svg>
          </ArkDialog.CloseTrigger>
        </div>

        <div :class="dialogBodyClass">
          <slot />
        </div>

        <div v-if="$slots.footer" :class="dialogFooterClass">
          <slot name="footer" />
        </div>
      </ArkDialog.Content>
    </ArkDialog.Positioner>
  </ArkDialog.Root>
</template>
