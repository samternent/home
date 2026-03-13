export const switchSizeValues = ["sm", "md"] as const;

export type SwitchSize = (typeof switchSizeValues)[number];
