export const tabsSizeValues = ["sm", "md"] as const;
export const tabsVariantValues = ["underline", "pill"] as const;

export type TabsSize = (typeof tabsSizeValues)[number];
export type TabsVariant = (typeof tabsVariantValues)[number];

export type TabItem = {
  disabled?: boolean;
  label: string;
  value: string;
};
