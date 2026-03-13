<script setup lang="ts">
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import { menuProps } from "./Menu.props";
import {
  menuArrowClass,
  menuContentClass,
  menuItemClass,
  menuPositionerClass,
  menuSeparatorClass,
} from "./Menu.variants";
import type { MenuItem } from "./Menu.types";

const emit = defineEmits<{
  select: [item: MenuItem];
}>();

const open = defineModel<boolean>("open", { default: false });
const props = defineProps(menuProps);

function handleSelect(item: MenuItem) {
  emit("select", item);
}
</script>

<template>
  <ArkMenu.Root v-model:open="open" :positioning="{ placement: props.placement }" lazy-mount unmount-on-exit>
    <ArkMenu.Trigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </ArkMenu.Trigger>
    <ArkMenu.Positioner :class="menuPositionerClass">
      <ArkMenu.Content :class="menuContentClass">
        <ArkMenu.Arrow v-if="props.showArrow" :class="menuArrowClass">
          <ArkMenu.ArrowTip />
        </ArkMenu.Arrow>
        <template v-for="(item, index) in props.items" :key="item.value ?? `separator-${index}`">
          <ArkMenu.Separator
            v-if="item.type === 'separator'"
            :class="menuSeparatorClass"
          />
          <ArkMenu.Item
            v-else
            :value="item.value ?? item.label ?? `item-${index}`"
            :disabled="item.disabled"
            :class="menuItemClass"
            @select="handleSelect(item)"
          >
            <slot name="item" :item="item">
              {{ item.label }}
            </slot>
          </ArkMenu.Item>
        </template>
      </ArkMenu.Content>
    </ArkMenu.Positioner>
  </ArkMenu.Root>
</template>
