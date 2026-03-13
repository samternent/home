import type { PropType } from "vue";
import type { LabelSize } from "./Label.types";

export const labelProps = {
  for: {
    type: String,
    default: undefined,
  },
  size: {
    type: String as PropType<LabelSize>,
    default: "md",
  },
  required: {
    type: Boolean,
    default: false,
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
