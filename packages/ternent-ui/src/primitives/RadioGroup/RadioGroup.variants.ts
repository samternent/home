import type {
  RadioGroupOrientation,
  RadioGroupSize,
} from "./RadioGroup.types";

export const radioGroupRootClass = "flex w-full";

export const radioGroupListOrientationClasses: Record<RadioGroupOrientation, string> = {
  horizontal: "flex flex-wrap gap-3",
  vertical: "flex flex-col gap-3",
};

export const radioGroupItemBaseClass =
  "group flex items-start gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] " +
  "bg-[var(--ui-surface)] px-3 transition-[border-color,background-color,box-shadow] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "hover:border-[var(--ui-primary-muted)] focus-within:ring-2 focus-within:ring-[var(--ui-ring)] " +
  "data-[state=checked]:border-[var(--ui-primary)] data-[state=checked]:bg-[var(--ui-primary-muted)]";

export const radioGroupItemStateClasses = {
  default: "",
  invalid:
    "border-[var(--ui-critical)] data-[state=checked]:border-[var(--ui-critical)] data-[state=checked]:bg-[var(--ui-critical-muted)]",
  disabled: "opacity-50",
} as const;

export const radioGroupItemSizeClasses: Record<RadioGroupSize, string> = {
  sm: "py-2",
  md: "py-3",
};

export const radioGroupControlBaseClass =
  "mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] " +
  "bg-[var(--ui-bg)] transition-[border-color,box-shadow] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "group-data-[state=checked]:border-[var(--ui-primary)]";

export const radioGroupControlSizeClasses: Record<RadioGroupSize, string> = {
  sm: "size-4",
  md: "size-5",
};

export const radioGroupIndicatorBaseClass =
  "rounded-full bg-[var(--ui-primary)] group-data-[state=checked]:bg-[var(--ui-primary)]";

export const radioGroupIndicatorSizeClasses: Record<RadioGroupSize, string> = {
  sm: "size-2",
  md: "size-2.5",
};

export const radioGroupLabelClass = "text-[var(--ui-fg)]";
export const radioGroupDescriptionClass = "text-sm text-[var(--ui-fg-muted)]";
