export const featureCardToneValues = [
  "primary",
  "secondary",
  "accent",
  "success",
  "info",
] as const;

export const featureCardSizeValues = ["md", "sm"] as const;
export const featureCardSurfaceValues = ["elevated", "panel", "subtle"] as const;

export type FeatureCardTone = (typeof featureCardToneValues)[number];
export type FeatureCardSize = (typeof featureCardSizeValues)[number];
export type FeatureCardSurface = (typeof featureCardSurfaceValues)[number];
