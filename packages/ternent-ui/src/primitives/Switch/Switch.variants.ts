import type { SwitchSize } from "./Switch.types";

export const switchRootClass =
  "group inline-flex w-fit items-start gap-3 rounded-[var(--ui-radius-md)] " +
  "focus-within:ring-2 focus-within:ring-[var(--ui-ring)]";

export const switchControlBaseClass =
  "relative inline-flex shrink-0 rounded-full border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] " +
  "transition-[background-color,border-color,box-shadow] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "group-hover:border-[var(--ui-primary-muted)] data-[state=checked]:border-[var(--ui-primary)] data-[state=checked]:bg-[var(--ui-primary)]";

export const switchControlStateClasses = {
  default: "",
  invalid:
    "border-[var(--ui-critical)] data-[state=checked]:border-[var(--ui-critical)] data-[state=checked]:bg-[var(--ui-critical)]",
  disabled: "opacity-50",
} as const;

export const switchControlSizeClasses: Record<SwitchSize, string> = {
  sm: "h-5 w-9",
  md: "h-6 w-10",
};

export const switchThumbBaseClass =
  "absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-[var(--ui-bg)] shadow-[var(--ui-shadow-sm)] " +
  "transition-transform duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]";

export const switchThumbSizeClasses: Record<SwitchSize, string> = {
  sm: "size-4 data-[state=checked]:translate-x-4",
  md: "size-5 data-[state=checked]:translate-x-4",
};

export const switchLabelClass = "text-[var(--ui-fg)]";
export const switchDescriptionClass = "text-sm text-[var(--ui-fg-muted)]";
