export const fileInputVariantValues = ["default", "dropzone"] as const;
export const fileInputSizeValues = ["sm", "md", "lg"] as const;

export type FileInputVariant = (typeof fileInputVariantValues)[number];
export type FileInputSize = (typeof fileInputSizeValues)[number];
export type FileInputValue = File | File[] | null;
