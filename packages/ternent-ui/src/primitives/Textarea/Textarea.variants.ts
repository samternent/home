import type { TextareaResize, TextareaSize } from "./Textarea.types";

export const textareaBaseClass =
  "flex w-full appearance-none border bg-[var(--ui-surface)] text-[var(--ui-fg)] " +
  "placeholder:text-[var(--ui-fg-muted)] rounded-[var(--ui-radius-md)] border-[var(--ui-border)] " +
  "transition-[box-shadow,border-color,background-color,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:border-[var(--ui-primary)] " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 " +
  "read-only:cursor-default read-only:bg-[var(--ui-tonal-tertiary)]";

export const textareaStateClasses = {
  default: "hover:border-[var(--ui-primary-muted)]",
  invalid:
    "border-[var(--ui-critical)] text-[var(--ui-fg)] " +
    "focus-visible:border-[var(--ui-critical)] focus-visible:ring-[var(--ui-critical-muted)]",
} as const;

export const textareaSizeClasses: Record<TextareaSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-4 py-3 text-base",
};

export const textareaResizeClasses: Record<TextareaResize, string> = {
  vertical: "resize-y",
  none: "resize-none",
};
