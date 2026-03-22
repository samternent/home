export const buttonVariantValues = [
  "primary",
  "accent",
  "secondary",
  "tertiary",
  "critical",
  "plain-primary",
  "plain-secondary",
  "critical-secondary",
] as const;

export const buttonSizeValues = ["micro", "xs", "sm", "md", "lg", "xl", "hero"] as const;
export const buttonElementValues = ["button", "a", "RouterLink"] as const;
export const buttonTypeValues = ["button", "submit", "reset"] as const;

export type ButtonVariant = (typeof buttonVariantValues)[number];
export type ButtonSize = (typeof buttonSizeValues)[number];
export type ButtonElement = (typeof buttonElementValues)[number];
export type ButtonNativeType = (typeof buttonTypeValues)[number];
