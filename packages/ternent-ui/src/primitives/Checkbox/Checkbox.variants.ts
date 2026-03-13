import type { CheckboxSize } from "./Checkbox.types";

export const checkboxRootClass =
  "group inline-flex w-fit items-start gap-3 rounded-[var(--ui-radius-md)] " +
  "focus-within:ring-2 focus-within:ring-[var(--ui-ring)]";

export const checkboxControlBaseClass =
  "inline-flex shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] border " +
  "border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-on-primary)] " +
  "transition-[background-color,border-color,box-shadow,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "group-hover:border-[var(--ui-primary-muted)] " +
  "data-[state=checked]:border-[var(--ui-primary)] data-[state=checked]:bg-[var(--ui-primary)] " +
  "data-[state=indeterminate]:border-[var(--ui-primary)] data-[state=indeterminate]:bg-[var(--ui-primary)]";

export const checkboxControlStateClasses = {
  default: "",
  invalid:
    "border-[var(--ui-critical)] data-[state=checked]:border-[var(--ui-critical)] data-[state=checked]:bg-[var(--ui-critical)] " +
    "data-[state=indeterminate]:border-[var(--ui-critical)] data-[state=indeterminate]:bg-[var(--ui-critical)]",
  disabled: "opacity-50",
} as const;

export const checkboxControlSizeClasses: Record<CheckboxSize, string> = {
  sm: "mt-0.5 size-4",
  md: "mt-0.5 size-5",
};

export const checkboxIndicatorSizeClasses: Record<CheckboxSize, string> = {
  sm: "size-3",
  md: "size-3.5",
};

export const checkboxLabelClass = "text-[var(--ui-fg)]";
export const checkboxDescriptionClass = "text-sm text-[var(--ui-fg-muted)]";
