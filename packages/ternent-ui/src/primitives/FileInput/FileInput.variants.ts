import type { FileInputSize } from "./FileInput.types";

export const fileInputRootClass = "flex w-full flex-col gap-3";

export const fileInputButtonBaseClass =
  "inline-flex w-full items-center gap-3 rounded-[var(--ui-radius-md)] border bg-[var(--ui-surface)] " +
  "text-left text-[var(--ui-fg)] transition-[background-color,border-color,box-shadow,color] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "border-[var(--ui-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:border-[var(--ui-primary)]";

export const fileInputButtonStateClasses = {
  default: "hover:border-[var(--ui-primary-muted)] hover:bg-[var(--ui-surface-hover)]",
  invalid:
    "border-[var(--ui-critical)] focus-visible:border-[var(--ui-critical)] focus-visible:ring-[var(--ui-critical-muted)]",
  disabled: "pointer-events-none cursor-not-allowed opacity-50",
} as const;

export const fileInputButtonSizeClasses: Record<FileInputSize, string> = {
  sm: "min-h-10 px-3 py-2 text-sm",
  md: "min-h-11 px-4 py-3 text-sm",
  lg: "min-h-12 px-4 py-3 text-base",
};

export const fileInputTextMutedClass = "text-[var(--ui-fg-muted)]";
export const fileInputTextStrongClass = "font-medium text-[var(--ui-fg)]";
export const fileInputIconClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] text-[var(--ui-primary)]";

export const fileInputDropzoneBaseClass =
  "flex w-full flex-col items-center justify-center rounded-[var(--ui-radius-lg)] border border-dashed " +
  "border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] text-center transition-[background-color,border-color,box-shadow,color] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:border-[var(--ui-primary)]";

export const fileInputDropzoneStateClasses = {
  default:
    "hover:border-[var(--ui-primary-muted)] hover:bg-[var(--ui-tonal-secondary)]",
  drag: "border-[var(--ui-primary)] bg-[var(--ui-primary-muted)]",
  invalid:
    "border-[var(--ui-critical)] focus-visible:border-[var(--ui-critical)] focus-visible:ring-[var(--ui-critical-muted)]",
  disabled: "pointer-events-none cursor-not-allowed opacity-50",
} as const;

export const fileInputDropzoneSizeClasses: Record<FileInputSize, string> = {
  sm: "min-h-36 px-4 py-5",
  md: "min-h-44 px-6 py-6",
  lg: "min-h-52 px-8 py-8",
};
