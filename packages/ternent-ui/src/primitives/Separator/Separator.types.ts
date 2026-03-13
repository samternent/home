export const separatorOrientationValues = ["horizontal", "vertical"] as const;

export type SeparatorOrientation = (typeof separatorOrientationValues)[number];
