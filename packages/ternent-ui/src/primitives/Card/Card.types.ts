export const cardVariantValues = ["default", "subtle", "outline"] as const;
export const cardPaddingValues = ["sm", "md", "lg"] as const;

export type CardVariant = (typeof cardVariantValues)[number];
export type CardPadding = (typeof cardPaddingValues)[number];
