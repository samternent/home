<script setup lang="ts">
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";
import { computed, useSlots } from "vue";
import { drawerProps } from "./Drawer.props";
import {
  drawerBackdropClass,
  drawerBodyClass,
  drawerCloseClass,
  drawerContentBaseClass,
  drawerContentSideClasses,
  drawerContentSizeClasses,
  drawerDescriptionClass,
  drawerFooterClass,
  drawerHeaderClass,
  drawerPositionerBaseClass,
  drawerPositionerSideClasses,
  drawerTitleClass,
} from "./Drawer.variants";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps(drawerProps);
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
    <ArkDialog.Backdrop :class="drawerBackdropClass" />
    <ArkDialog.Positioner
      :class="[drawerPositionerBaseClass, drawerPositionerSideClasses[props.side]]"
    >
      <ArkDialog.Content
        :class="[
          drawerContentBaseClass,
          drawerContentSideClasses[props.side],
          drawerContentSizeClasses[props.size],
        ]"
      >
        <div v-if="hasHeader" :class="drawerHeaderClass">
          <slot name="header">
            <div class="min-w-0 flex-1">
              <ArkDialog.Title v-if="props.title" :class="drawerTitleClass">
                {{ props.title }}
              </ArkDialog.Title>
              <ArkDialog.Description
                v-if="props.description"
                :class="drawerDescriptionClass"
              >
                {{ props.description }}
              </ArkDialog.Description>
            </div>
          </slot>
          <ArkDialog.CloseTrigger
            v-if="props.showClose"
            :class="drawerCloseClass"
            aria-label="Close drawer"
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

        <div :class="drawerBodyClass">
          <slot />
        </div>

        <div v-if="$slots.footer" :class="drawerFooterClass">
          <slot name="footer" />
        </div>
      </ArkDialog.Content>
    </ArkDialog.Positioner>
  </ArkDialog.Root>
</template>
