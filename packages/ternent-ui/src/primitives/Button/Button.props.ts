import type { PropType } from "vue";
import type {
  ButtonElement,
  ButtonNativeType,
  ButtonSize,
  ButtonVariant,
} from "./Button.types";

export const buttonProps = {
  as: {
    type: String as PropType<ButtonElement>,
    default: "button",
  },
  variant: {
    type: String as PropType<ButtonVariant>,
    default: "primary",
  },
  size: {
    type: String as PropType<ButtonSize>,
    default: "md",
  },
  type: {
    type: String as PropType<ButtonNativeType>,
    default: "button",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
};
