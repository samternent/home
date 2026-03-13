import type { PropType } from "vue";
import type { BadgeSize, BadgeTone, BadgeVariant } from "./Badge.types";

export const badgeProps = {
  tone: {
    type: String as PropType<BadgeTone>,
    default: "neutral",
  },
  variant: {
    type: String as PropType<BadgeVariant>,
    default: "soft",
  },
  size: {
    type: String as PropType<BadgeSize>,
    default: "sm",
  },
};
