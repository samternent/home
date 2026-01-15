<script setup lang="ts">
import { Accordion } from "@ark-ui/vue/accordion";

defineProps({
  value: { default: null, required: true },
});
</script>

<template>
  <Accordion.Item :value="value">
    <div
      class="w-full flex items-center border-b border-[var(--rule)] p-1 gap-2"
    >
      <slot name="title" />
      <Accordion.ItemTrigger>
        <Accordion.ItemContext v-slot="context">
          <Accordion.ItemIndicator>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              :class="[
                'size-4 transition-transform duration-300 ease-in-out',
                {
                  'rotate-180': context.expanded,
                },
              ]"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </Accordion.ItemIndicator>
        </Accordion.ItemContext>
      </Accordion.ItemTrigger>
    </div>
    <Accordion.ItemContent>
      <slot />
    </Accordion.ItemContent>
  </Accordion.Item>
</template>
<style scoped>
@keyframes slideDown {
  from {
    opacity: 0.01;
    height: 0;
  }
  to {
    opacity: 1;
    height: var(--height);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    height: var(--height);
  }
  to {
    opacity: 0.01;
    height: 0;
  }
}

[data-scope="accordion"][data-part="item-content"][data-state="open"] {
  animation: slideDown 250ms ease-in-out;
}

[data-scope="accordion"][data-part="item-content"][data-state="closed"] {
  animation: slideUp 200ms ease-in-out;
}
</style>
