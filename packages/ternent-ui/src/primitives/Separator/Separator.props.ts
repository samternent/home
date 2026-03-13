import type { PropType } from "vue";
import type { SeparatorOrientation } from "./Separator.types";

export const separatorProps = {
  orientation: {
    type: String as PropType<SeparatorOrientation>,
    default: "horizontal",
  },
};
