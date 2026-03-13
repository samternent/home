export const tooltipPlacementValues = ["top", "bottom", "left", "right"] as const;

export type TooltipPlacement = (typeof tooltipPlacementValues)[number];
