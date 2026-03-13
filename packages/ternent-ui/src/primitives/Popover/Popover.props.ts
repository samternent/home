import type { PropType } from "vue";
import type { PopoverPlacement } from "./Popover.types";

export const popoverProps = {
  title: {
    type: String,
    default: undefined,
  },
  description: {
    type: String,
    default: undefined,
  },
  placement: {
    type: String as PropType<PopoverPlacement>,
    default: "bottom",
  },
  showArrow: {
    type: Boolean,
    default: true,
  },
  showClose: {
    type: Boolean,
    default: false,
  },
};
