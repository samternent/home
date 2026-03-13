import type { PropType } from "vue";
import type { TooltipPlacement } from "./Tooltip.types";

export const tooltipProps = {
  placement: {
    type: String as PropType<TooltipPlacement>,
    default: "top",
  },
  openDelay: {
    type: Number,
    default: 200,
  },
  closeDelay: {
    type: Number,
    default: 100,
  },
  showArrow: {
    type: Boolean,
    default: true,
  },
};
