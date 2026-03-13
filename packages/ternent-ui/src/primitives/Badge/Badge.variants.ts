import type { BadgeSize, BadgeTone, BadgeVariant } from "./Badge.types";

export const badgeBaseClass =
  "inline-flex items-center gap-1 rounded-full border font-medium tracking-[0.02em]";

export const badgeSizeClasses: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-[11px]",
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export const badgeToneVariantClasses: Record<BadgeTone, Record<BadgeVariant, string>> = {
  neutral: {
    soft: "border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] text-[var(--ui-fg)]",
    solid: "border-transparent bg-[var(--ui-fg)] text-[var(--ui-bg)]",
    outline: "border-[var(--ui-border)] bg-transparent text-[var(--ui-fg)]",
  },
  primary: {
    soft: "border-[var(--ui-primary-muted)] bg-[var(--ui-primary-muted)] text-[var(--ui-primary)]",
    solid: "border-transparent bg-[var(--ui-primary)] text-[var(--ui-on-primary)]",
    outline: "border-[var(--ui-primary)] bg-transparent text-[var(--ui-primary)]",
  },
  secondary: {
    soft: "border-[var(--ui-secondary-muted)] bg-[var(--ui-secondary-muted)] text-[var(--ui-secondary)]",
    solid: "border-transparent bg-[var(--ui-secondary)] text-[var(--ui-on-secondary)]",
    outline: "border-[var(--ui-secondary)] bg-transparent text-[var(--ui-secondary)]",
  },
  accent: {
    soft: "border-[var(--ui-accent-muted)] bg-[var(--ui-accent-muted)] text-[var(--ui-accent)]",
    solid: "border-transparent bg-[var(--ui-accent)] text-[var(--ui-on-accent)]",
    outline: "border-[var(--ui-accent)] bg-transparent text-[var(--ui-accent)]",
  },
  success: {
    soft: "border-[var(--ui-success-muted)] bg-[var(--ui-success-muted)] text-[var(--ui-success)]",
    solid: "border-transparent bg-[var(--ui-success)] text-[var(--ui-on-success)]",
    outline: "border-[var(--ui-success)] bg-transparent text-[var(--ui-success)]",
  },
  warning: {
    soft: "border-[var(--ui-warning-muted)] bg-[var(--ui-warning-muted)] text-[var(--ui-warning)]",
    solid: "border-transparent bg-[var(--ui-warning)] text-[var(--ui-on-warning)]",
    outline: "border-[var(--ui-warning)] bg-transparent text-[var(--ui-warning)]",
  },
  critical: {
    soft: "border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] text-[var(--ui-critical)]",
    solid: "border-transparent bg-[var(--ui-critical)] text-[var(--ui-on-critical)]",
    outline: "border-[var(--ui-critical)] bg-transparent text-[var(--ui-critical)]",
  },
};
