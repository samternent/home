import type { PropType } from "vue";
import type {
  RadioGroupOption,
  RadioGroupOrientation,
  RadioGroupSize,
} from "./RadioGroup.types";

export const radioGroupProps = {
  modelValue: {
    type: String,
    default: "",
  },
  options: {
    type: Array as PropType<RadioGroupOption[]>,
    default: () => [],
  },
  orientation: {
    type: String as PropType<RadioGroupOrientation>,
    default: "vertical",
  },
  size: {
    type: String as PropType<RadioGroupSize>,
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
