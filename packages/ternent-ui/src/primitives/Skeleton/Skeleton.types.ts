export const skeletonShapeValues = ["line", "block", "circle"] as const;
export const skeletonSizeValues = ["sm", "md", "lg"] as const;

export type SkeletonShape = (typeof skeletonShapeValues)[number];
export type SkeletonSize = (typeof skeletonSizeValues)[number];
