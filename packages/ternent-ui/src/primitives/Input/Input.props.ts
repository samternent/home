import type { PropType } from "vue";
import type { InputSize, InputType } from "./Input.types";

export const inputProps = {
  modelValue: {
    type: [String, Number],
    default: "",
  },
  type: {
    type: String as PropType<InputType>,
    default: "text",
  },
  size: {
    type: String as PropType<InputSize>,
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
  readonly: {
    type: Boolean,
    default: false,
  },
};
