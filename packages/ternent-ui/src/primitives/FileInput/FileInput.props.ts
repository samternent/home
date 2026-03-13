import type { PropType } from "vue";
import type {
  FileInputSize,
  FileInputValue,
  FileInputVariant,
} from "./FileInput.types";

export const fileInputProps = {
  modelValue: {
    type: [Object, Array, null] as PropType<FileInputValue>,
    default: null,
  },
  accept: {
    type: String,
    default: undefined,
  },
  multiple: {
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
  size: {
    type: String as PropType<FileInputSize>,
    default: "md",
  },
  variant: {
    type: String as PropType<FileInputVariant>,
    default: "default",
  },
  placeholder: {
    type: String,
    default: "Choose file",
  },
  dropzoneTitle: {
    type: String,
    default: "Drop files here or click to browse",
  },
};
