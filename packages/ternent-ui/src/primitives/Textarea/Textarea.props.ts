import type { PropType } from "vue";
import type { TextareaResize, TextareaSize } from "./Textarea.types";

export const textareaProps = {
  modelValue: {
    type: String,
    default: "",
  },
  size: {
    type: String as PropType<TextareaSize>,
    default: "md",
  },
  rows: {
    type: Number,
    default: 4,
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
  resize: {
    type: String as PropType<TextareaResize>,
    default: "vertical",
  },
};
