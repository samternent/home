import type { PropType } from "vue";
import type { TabItem, TabsSize, TabsVariant } from "./Tabs.types";

export const tabsProps = {
  modelValue: {
    type: String,
    default: undefined,
  },
  items: {
    type: Array as PropType<TabItem[]>,
    default: () => [],
  },
  size: {
    type: String as PropType<TabsSize>,
    default: "md",
  },
  variant: {
    type: String as PropType<TabsVariant>,
    default: "underline",
  },
  lazyMount: {
    type: Boolean,
    default: true,
  },
};
