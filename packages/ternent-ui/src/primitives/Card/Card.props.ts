import type { PropType } from "vue";
import type { CardPadding, CardVariant } from "./Card.types";

export const cardProps = {
  variant: {
    type: String as PropType<CardVariant>,
    default: "default",
  },
  padding: {
    type: String as PropType<CardPadding>,
    default: "md",
  },
  interactive: {
    type: Boolean,
    default: false,
  },
};
