export const splitViewRailWidthValues = ["sm", "md", "lg"] as const;

export type SplitViewRailWidth = (typeof splitViewRailWidthValues)[number];
