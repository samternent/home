export const menuPlacementValues = ["top", "bottom", "left", "right"] as const;

export type MenuPlacement = (typeof menuPlacementValues)[number];

export type MenuItem = {
  disabled?: boolean;
  label?: string;
  type?: "item" | "separator";
  value?: string;
};
