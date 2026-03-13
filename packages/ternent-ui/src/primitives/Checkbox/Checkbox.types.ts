export const checkboxSizeValues = ["sm", "md"] as const;

export type CheckboxSize = (typeof checkboxSizeValues)[number];
export type CheckboxCheckedValue = boolean | "indeterminate";
