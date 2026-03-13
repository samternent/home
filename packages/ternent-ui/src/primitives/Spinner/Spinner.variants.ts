import type { SpinnerSize, SpinnerTone } from "./Spinner.types";

export const spinnerBaseClass = "animate-spin";

export const spinnerSizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

export const spinnerToneClasses: Record<SpinnerTone, string> = {
  primary: "text-[var(--ui-primary)]",
  muted: "text-[var(--ui-fg-muted)]",
  critical: "text-[var(--ui-critical)]",
};
