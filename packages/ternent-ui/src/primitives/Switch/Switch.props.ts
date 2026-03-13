import type { PropType } from "vue";
import type { SwitchSize } from "./Switch.types";

export const switchProps = {
  modelValue: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String as PropType<SwitchSize>,
    default: "md",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  invalid: {
    type: Boolean,
    default: false,
  },
};
