export const textareaSizeValues = ["sm", "md", "lg"] as const;
export const textareaResizeValues = ["vertical", "none"] as const;

export type TextareaSize = (typeof textareaSizeValues)[number];
export type TextareaResize = (typeof textareaResizeValues)[number];
