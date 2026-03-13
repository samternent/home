<script setup lang="ts">
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";
import { computed } from "vue";
import { tabsProps } from "./Tabs.props";
import {
  tabsContentClass,
  tabsListBaseClass,
  tabsListVariantClasses,
  tabsRootClass,
  tabsTriggerBaseClass,
  tabsTriggerSizeClasses,
  tabsTriggerVariantClasses,
} from "./Tabs.variants";

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const props = defineProps(tabsProps);

const model = computed({
  get: () => props.modelValue ?? props.items[0]?.value,
  set: (value: string) => emit("update:modelValue", value),
});
</script>

<template>
  <ArkTabs.Root v-model="model" :lazy-mount="props.lazyMount" unmount-on-exit :class="tabsRootClass">
    <ArkTabs.List :class="[tabsListBaseClass, tabsListVariantClasses[props.variant]]">
      <ArkTabs.Trigger
        v-for="item in props.items"
        :key="item.value"
        :value="item.value"
        :disabled="item.disabled"
        :class="[
          tabsTriggerBaseClass,
          tabsTriggerSizeClasses[props.size],
          tabsTriggerVariantClasses[props.variant],
        ]"
      >
        {{ item.label }}
      </ArkTabs.Trigger>
    </ArkTabs.List>

    <ArkTabs.Content
      v-for="item in props.items"
      :key="`panel-${item.value}`"
      :value="item.value"
      :class="tabsContentClass"
    >
      <slot :name="`panel-${item.value}`" :item="item" />
    </ArkTabs.Content>
  </ArkTabs.Root>
</template>
