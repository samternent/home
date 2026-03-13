import type { PropType } from "vue";
import type { MenuItem, MenuPlacement } from "./Menu.types";

export const menuProps = {
  items: {
    type: Array as PropType<MenuItem[]>,
    default: () => [],
  },
  placement: {
    type: String as PropType<MenuPlacement>,
    default: "bottom",
  },
  showArrow: {
    type: Boolean,
    default: true,
  },
};
