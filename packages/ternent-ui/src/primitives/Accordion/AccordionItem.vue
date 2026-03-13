<script setup lang="ts">
import { Accordion as ArkAccordion } from "@ark-ui/vue/accordion";
import { accordionItemProps } from "./AccordionItem.props";
import {
  accordionContentClass,
  accordionIndicatorClass,
  accordionItemClass,
  accordionPanelClass,
  accordionTitleClass,
  accordionTriggerClass,
} from "./Accordion.variants";

const props = defineProps(accordionItemProps);
</script>

<template>
  <ArkAccordion.Item :value="props.value" :disabled="props.disabled" :class="accordionItemClass">
    <ArkAccordion.ItemTrigger :class="accordionTriggerClass">
      <slot name="title">
        <span :class="accordionTitleClass">{{ props.title }}</span>
      </slot>
      <ArkAccordion.ItemIndicator :class="accordionIndicatorClass">
        <svg viewBox="0 0 20 20" fill="none" class="size-full" aria-hidden="true">
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </ArkAccordion.ItemIndicator>
    </ArkAccordion.ItemTrigger>
    <ArkAccordion.ItemContent :class="accordionContentClass">
      <div :class="accordionPanelClass">
        <slot />
      </div>
    </ArkAccordion.ItemContent>
  </ArkAccordion.Item>
</template>
