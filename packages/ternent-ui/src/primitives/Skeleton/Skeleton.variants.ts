import type { SkeletonShape, SkeletonSize } from "./Skeleton.types";

export const skeletonBaseClass =
  "bg-[linear-gradient(90deg,var(--ui-tonal-secondary),var(--ui-surface-hover),var(--ui-tonal-secondary))] bg-[length:200%_100%]";

export const skeletonShapeClasses: Record<SkeletonShape, string> = {
  line: "w-full rounded-[var(--ui-radius-sm)]",
  block: "w-full rounded-[var(--ui-radius-md)]",
  circle: "aspect-square rounded-full",
};

export const skeletonSizeClasses: Record<SkeletonSize, string> = {
  sm: "h-4",
  md: "h-5",
  lg: "h-6",
};

export const skeletonAnimatedClass = "animate-[skeleton-shimmer_1.6s_linear_infinite]";
