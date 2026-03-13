import type { PropType } from "vue";
import type { SkeletonShape, SkeletonSize } from "./Skeleton.types";

export const skeletonProps = {
  shape: {
    type: String as PropType<SkeletonShape>,
    default: "line",
  },
  size: {
    type: String as PropType<SkeletonSize>,
    default: "md",
  },
  lines: {
    type: Number,
    default: 1,
  },
  animated: {
    type: Boolean,
    default: true,
  },
};
