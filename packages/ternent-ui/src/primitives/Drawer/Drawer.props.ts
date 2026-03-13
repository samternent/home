import type { PropType } from "vue";
import type { DrawerSide, DrawerSize } from "./Drawer.types";

export const drawerProps = {
  title: {
    type: String,
    default: undefined,
  },
  description: {
    type: String,
    default: undefined,
  },
  side: {
    type: String as PropType<DrawerSide>,
    default: "right",
  },
  size: {
    type: String as PropType<DrawerSize>,
    default: "md",
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  closeOnInteractOutside: {
    type: Boolean,
    default: true,
  },
};
