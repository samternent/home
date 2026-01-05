import type { PropType } from "vue";
import type { ButtonVariant, ButtonSize } from "./Button.types";

export const buttonProps = {
  as: {
    type: String as PropType<"button" | "a">,
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
  disabled: {
    type: Boolean,
    default: false,
  },
};
