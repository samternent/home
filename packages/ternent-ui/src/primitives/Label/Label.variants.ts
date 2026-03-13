import type { LabelSize } from "./Label.types";

export const labelBaseClass =
  "inline-flex items-center gap-1 font-medium text-[var(--ui-fg)]";

export const labelStateClasses = {
  default: "",
  disabled: "opacity-50",
  invalid: "text-[var(--ui-critical)]",
} as const;

export const labelSizeClasses: Record<LabelSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export const labelRequiredClass = "text-[var(--ui-critical)]";
