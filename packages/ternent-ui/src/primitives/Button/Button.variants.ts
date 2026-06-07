import type { ButtonSize, ButtonVariant } from "./Button.types";

export const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 border border-transparent " +
  "font-medium select-none whitespace-nowrap align-middle " +
  "rounded-[var(--ui-radius-lg)] " +
  "transition-[background-color,opacity,border-color,color,box-shadow,transform] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]";

export const buttonStateClasses = {
  interactive: "cursor-pointer",
  disabled: "cursor-not-allowed pointer-events-none opacity-40 shadow-none",
  loading: "cursor-progress pointer-events-none opacity-75 shadow-none",
} as const;

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ui-primary)] text-[var(--ui-on-primary)] " +
    "shadow-[var(--ui-shadow-sm)] hover:bg-[var(--ui-primary-hover)] hover:shadow-[var(--ui-shadow-md)] active:bg-[var(--ui-primary-active)]",

  accent:
    "bg-[var(--ui-accent)] text-[var(--ui-on-accent)] " +
    "hover:bg-[var(--ui-accent-hover)] active:bg-[var(--ui-accent-active)]",

  secondary:
    "border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)] " +
    "hover:bg-[var(--ui-surface-hover)] hover:border-[color-mix(in_srgb,var(--ui-border)_88%,var(--ui-fg)_12%)]",

  tertiary:
    "bg-[var(--ui-tonal-secondary)] text-[var(--ui-fg)] " +
    "hover:bg-[var(--ui-tonal-secondary-hover)]",

  critical:
    "bg-[var(--ui-critical)] text-[var(--ui-on-critical)] " +
    "hover:bg-[var(--ui-critical-hover)] active:bg-[var(--ui-critical-active)]",

  "plain-primary":
    "bg-transparent text-[var(--ui-primary)] shadow-none " +
    "hover:bg-[var(--ui-primary-muted)] active:bg-[var(--ui-primary-hover)] " +
    "hover:shadow-none",

  "plain-secondary":
    "bg-transparent text-[var(--ui-fg-muted)] shadow-none " +
    "hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-fg)] hover:shadow-none",

  "critical-secondary":
    "bg-transparent text-[var(--ui-critical)] border-[var(--ui-critical-muted)] shadow-none " +
    "hover:bg-[var(--ui-critical-muted)] active:bg-[var(--ui-critical-hover)] " +
    "hover:shadow-none",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  micro: "h-7 px-2 text-xs",
  xs: "h-8 px-3 text-xs",
  sm: "h-10 px-4 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  xl: "h-12 px-6 text-base",
  hero: "h-16 px-8 text-base uppercase tracking-[0.14em]",
};

export const buttonLabelClass = "inline-flex items-center gap-2";
export const buttonAdornmentClass = "inline-flex shrink-0 items-center justify-center";
export const buttonSpinnerClass =
  "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent";
