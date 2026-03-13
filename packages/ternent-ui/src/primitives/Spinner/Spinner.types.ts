export const spinnerSizeValues = ["sm", "md", "lg"] as const;
export const spinnerToneValues = ["primary", "muted", "critical"] as const;

export type SpinnerSize = (typeof spinnerSizeValues)[number];
export type SpinnerTone = (typeof spinnerToneValues)[number];
