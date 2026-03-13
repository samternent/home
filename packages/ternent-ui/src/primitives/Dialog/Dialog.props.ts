import type { PropType } from "vue";
import type { DialogSize } from "./Dialog.types";

export const dialogProps = {
  title: {
    type: String,
    default: undefined,
  },
  description: {
    type: String,
    default: undefined,
  },
  size: {
    type: String as PropType<DialogSize>,
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
