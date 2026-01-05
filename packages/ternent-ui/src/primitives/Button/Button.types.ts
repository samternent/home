export const buttonVariants = [
  "primary",
  "secondary",
  "tertiary",
  "critical",
  "plain-primary",
  "plain-secondary",
  "critical-secondary",
] as const;

export type ButtonVariant = (typeof buttonVariants)[number];
export type ButtonSize = "sm" | "md" | "lg";
