export const drawerSideValues = ["left", "right"] as const;
export const drawerSizeValues = ["sm", "md", "lg"] as const;

export type DrawerSide = (typeof drawerSideValues)[number];
export type DrawerSize = (typeof drawerSizeValues)[number];
