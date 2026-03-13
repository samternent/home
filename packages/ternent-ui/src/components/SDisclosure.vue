<script setup lang="ts">
import { computed } from "vue";
import { Collapsible } from "@ark-ui/vue/collapsible";

const props = withDefaults(
  defineProps<{
    label: string;
    openLabel?: string;
    contentClass?: string;
    triggerClass?: string;
    disabled?: boolean;
    lazyMount?: boolean;
  }>(),
  {
    openLabel: undefined,
    contentClass: "",
    triggerClass: "",
    disabled: false,
    lazyMount: true,
  }
);

const open = defineModel("open", {
  type: Boolean,
  default: false,
});

const triggerText = computed(() => {
  if (open.value && props.openLabel) return props.openLabel;
  return props.label;
});
</script>

<template>
  <Collapsible.Root
    v-model:open="open"
    :disabled="disabled"
    :lazy-mount="lazyMount"
    unmount-on-exit
    class="s-disclosure"
  >
    <Collapsible.Trigger class="s-disclosure__trigger" :class="triggerClass">
      <span class="s-disclosure__label">{{ triggerText }}</span>
      <Collapsible.Indicator class="s-disclosure__indicator" aria-hidden="true">
        ▾
      </Collapsible.Indicator>
    </Collapsible.Trigger>

    <Collapsible.Content class="s-disclosure__content">
      <div class="s-disclosure__panel" :class="contentClass">
        <slot />
      </div>
    </Collapsible.Content>
  </Collapsible.Root>
</template>

<style scoped>
.s-disclosure {
  width: 100%;
}

.s-disclosure__trigger {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-md);
  background: color-mix(in srgb, var(--ui-surface) 82%, var(--ui-surface-hover));
  color: var(--ui-fg-muted);
  padding: 0.5rem 0.75rem;
  font-size: 0.88rem;
  line-height: 1.2;
  transition: color var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out),
    border-color var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out),
    background-color var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out);
}

.s-disclosure__trigger:hover {
  color: var(--ui-fg);
  background: var(--ui-surface-hover);
}

.s-disclosure__trigger:focus-visible {
  outline: 2px solid var(--ui-ring);
  outline-offset: 2px;
}

.s-disclosure__label {
  white-space: nowrap;
}

.s-disclosure__indicator {
  font-size: 0.8rem;
  transform: rotate(-90deg);
  transition: transform 180ms ease;
}

[data-scope="collapsible"][data-part="trigger"][data-state="open"] .s-disclosure__indicator {
  transform: rotate(0deg);
}

.s-disclosure__content {
  overflow: hidden;
}

.s-disclosure__panel {
  margin-top: 0.75rem;
}

@keyframes s-disclosure-slide-down {
  from {
    opacity: 0.01;
    height: 0;
  }
  to {
    opacity: 1;
    height: var(--height);
  }
}

@keyframes s-disclosure-slide-up {
  from {
    opacity: 1;
    height: var(--height);
  }
  to {
    opacity: 0.01;
    height: 0;
  }
}

[data-scope="collapsible"][data-part="content"][data-state="open"] {
  animation: s-disclosure-slide-down 180ms ease;
}

[data-scope="collapsible"][data-part="content"][data-state="closed"] {
  animation: s-disclosure-slide-up 140ms ease;
}
</style>
