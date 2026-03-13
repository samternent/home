export const badgeToneValues = [
  "neutral",
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "critical",
] as const;
export const badgeVariantValues = ["soft", "solid", "outline"] as const;
export const badgeSizeValues = ["xs", "sm", "md"] as const;

export type BadgeTone = (typeof badgeToneValues)[number];
export type BadgeVariant = (typeof badgeVariantValues)[number];
export type BadgeSize = (typeof badgeSizeValues)[number];
