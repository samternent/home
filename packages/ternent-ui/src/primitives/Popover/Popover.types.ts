export const popoverPlacementValues = ["top", "bottom", "left", "right"] as const;

export type PopoverPlacement = (typeof popoverPlacementValues)[number];
