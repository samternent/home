export const dialogSizeValues = ["sm", "md", "lg", "xl"] as const;

export type DialogSize = (typeof dialogSizeValues)[number];
