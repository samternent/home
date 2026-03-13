export const radioGroupSizeValues = ["sm", "md"] as const;
export const radioGroupOrientationValues = ["horizontal", "vertical"] as const;

export type RadioGroupSize = (typeof radioGroupSizeValues)[number];
export type RadioGroupOrientation = (typeof radioGroupOrientationValues)[number];

export type RadioGroupOption = {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string;
};
