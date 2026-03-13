export const accordionValueModeValues = ["single", "multiple"] as const;

export type AccordionValueMode = (typeof accordionValueModeValues)[number];
export type AccordionValue = string | string[] | undefined;
