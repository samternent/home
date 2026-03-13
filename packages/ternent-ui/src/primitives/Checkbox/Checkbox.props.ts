import type { PropType } from "vue";
import type { CheckboxCheckedValue, CheckboxSize } from "./Checkbox.types";

export const checkboxProps = {
  modelValue: {
    type: [Boolean, String] as PropType<CheckboxCheckedValue>,
    default: false,
  },
  size: {
    type: String as PropType<CheckboxSize>,
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
