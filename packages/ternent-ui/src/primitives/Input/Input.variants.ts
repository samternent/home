import type { InputSize } from "./Input.types";

export const inputWrapperClass = "relative w-full";

export const inputBaseClass =
  "flex w-full appearance-none items-center border bg-[var(--ui-surface)] " +
  "text-[var(--ui-fg)] placeholder:text-[var(--ui-fg-muted)] " +
  "transition-[box-shadow,border-color,background-color,color] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "rounded-[var(--ui-radius-md)] border-[var(--ui-border)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:border-[var(--ui-primary)] " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 " +
  "read-only:cursor-default read-only:bg-[var(--ui-tonal-tertiary)]";

export const inputStateClasses = {
  default: "hover:border-[var(--ui-primary-muted)]",
  invalid:
    "border-[var(--ui-critical)] text-[var(--ui-fg)] " +
    "focus-visible:border-[var(--ui-critical)] focus-visible:ring-[var(--ui-critical-muted)]",
} as const;

export const inputSizeClasses: Record<InputSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-4 text-base",
};

export const inputPaddingWithLeading: Record<InputSize, string> = {
  sm: "pl-9",
  md: "pl-10",
  lg: "pl-11",
};

export const inputPaddingWithTrailing: Record<InputSize, string> = {
  sm: "pr-9",
  md: "pr-10",
  lg: "pr-11",
};

export const inputAdornmentBaseClass =
  "pointer-events-none absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-[var(--ui-fg-muted)]";

export const inputAdornmentPositionClasses = {
  leading: {
    sm: "left-3 size-4",
    md: "left-3 size-4",
    lg: "left-4 size-5",
  },
  trailing: {
    sm: "right-3 size-4",
    md: "right-3 size-4",
    lg: "right-4 size-5",
  },
} as const;
