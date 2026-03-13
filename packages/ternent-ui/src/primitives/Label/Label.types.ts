export const labelSizeValues = ["sm", "md", "lg"] as const;

export type LabelSize = (typeof labelSizeValues)[number];
