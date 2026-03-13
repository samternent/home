import type { ButtonSize, ButtonVariant } from "./Button.types";

export const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 border border-transparent " +
  "font-medium select-none whitespace-nowrap align-middle " +
  "rounded-[var(--ui-radius-md)] " +
  "transition-[transform,box-shadow,background-color,opacity,border-color,color] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]";

export const buttonStateClasses = {
  interactive:
    "cursor-pointer shadow-[var(--ui-shadow-sm)] " +
    "hover:shadow-[var(--ui-shadow-md)] hover:translate-y-[var(--ui-lift-hover)] " +
    "active:translate-y-0 active:scale-[var(--ui-scale-active)]",
  disabled: "cursor-not-allowed pointer-events-none opacity-40 shadow-none",
  loading: "cursor-progress pointer-events-none opacity-75 shadow-[var(--ui-shadow-sm)]",
} as const;

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ui-primary)] text-[var(--ui-on-primary)] " +
    "hover:bg-[var(--ui-primary-hover)] active:bg-[var(--ui-primary-active)] " +
    "hover:shadow-[var(--ui-glow-primary)]",

  secondary:
    "bg-[var(--ui-tonal-secondary)] text-[var(--ui-fg)] " +
    "hover:bg-[var(--ui-tonal-secondary-hover)]",

  tertiary:
    "bg-[var(--ui-tonal-tertiary)] text-[var(--ui-fg)] " +
    "hover:bg-[var(--ui-tonal-tertiary-hover)]",

  critical:
    "bg-[var(--ui-critical)] text-[var(--ui-on-critical)] " +
    "hover:bg-[var(--ui-critical-hover)] active:bg-[var(--ui-critical-active)] " +
    "hover:shadow-[var(--ui-glow-critical)]",

  "plain-primary":
    "bg-transparent text-[var(--ui-primary)] shadow-none " +
    "hover:bg-[var(--ui-primary-muted)] active:bg-[var(--ui-primary-hover)] " +
    "hover:shadow-none",

  "plain-secondary":
    "bg-transparent text-[var(--ui-fg)] opacity-80 shadow-none " +
    "hover:bg-[var(--ui-surface-hover)] hover:opacity-100 hover:shadow-none",

  "critical-secondary":
    "bg-transparent text-[var(--ui-critical)] border-[var(--ui-critical-muted)] shadow-none " +
    "hover:bg-[var(--ui-critical-muted)] active:bg-[var(--ui-critical-hover)] " +
    "hover:shadow-none",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  micro: "h-7 px-2 text-xs",
  xs: "h-8 px-3 text-xs",
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  xl: "h-12 px-6 text-base",
};

export const buttonLabelClass = "inline-flex items-center gap-2";
export const buttonAdornmentClass = "inline-flex shrink-0 items-center justify-center";
export const buttonSpinnerClass =
  "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent";
