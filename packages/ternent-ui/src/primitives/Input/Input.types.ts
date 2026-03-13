export const inputSizeValues = ["sm", "md", "lg"] as const;
export const inputTypeValues = [
  "text",
  "email",
  "password",
  "search",
  "url",
  "tel",
  "number",
] as const;

export type InputSize = (typeof inputSizeValues)[number];
export type InputType = (typeof inputTypeValues)[number];
