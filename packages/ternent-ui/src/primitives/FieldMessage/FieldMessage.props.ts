import type { PropType } from "vue";
import type { FieldMessageSize, FieldMessageTone } from "./FieldMessage.types";

export const fieldMessageProps = {
  id: {
    type: String,
    default: undefined,
  },
  size: {
    type: String as PropType<FieldMessageSize>,
    default: "md",
  },
  tone: {
    type: String as PropType<FieldMessageTone>,
    default: "muted",
  },
};
