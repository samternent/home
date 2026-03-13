import type { PropType } from "vue";
import type { SpinnerSize, SpinnerTone } from "./Spinner.types";

export const spinnerProps = {
  size: {
    type: String as PropType<SpinnerSize>,
    default: "md",
  },
  tone: {
    type: String as PropType<SpinnerTone>,
    default: "primary",
  },
};
