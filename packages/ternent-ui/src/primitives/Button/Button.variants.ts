export const buttonVariants = {
  base:
    "inline-flex items-center justify-center gap-2 border-0 cursor-pointer " +
    "font-medium select-none whitespace-nowrap " +
    "rounded-[var(--ui-radius-md)] " +
    "transition-[transform,box-shadow,background-color,opacity,border-color] " +
    "duration-[var(--ui-duration-normal)] " +
    "ease-[var(--ui-ease-out)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] " +
    "disabled:opacity-40 disabled:pointer-events-none",

  interaction:
    "shadow-[var(--ui-shadow-sm)] " +
    "hover:shadow-[var(--ui-shadow-md)] " +
    "hover:translate-y-[var(--ui-lift-hover)] " +
    "active:scale-[var(--ui-scale-active)]",

  variants: {
    variant: {
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
        "bg-transparent text-[var(--ui-primary)] " +
        "hover:bg-[var(--ui-primary-muted)] active:bg-[var(--ui-primary-hover)] " +
        "shadow-none hover:shadow-none",

      "plain-secondary":
        "bg-transparent text-[var(--ui-fg)] opacity-80 " +
        "hover:opacity-100 hover:bg-[var(--ui-surface-hover)] " +
        "shadow-none hover:shadow-none",

      "critical-secondary":
        "bg-transparent text-[var(--ui-critical)] border border-[var(--ui-critical-muted)] " +
        "hover:bg-[var(--ui-critical-muted)] active:bg-[var(--ui-critical-hover)] " +
        "shadow-none hover:shadow-none",
    },

    size: {
      micro: "h-7 px-2 text-xs",
      xs: "h-8 px-3 text-xs",
      sm: "h-9 px-4 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-5 text-base",
      xl: "h-12 px-6 text-base",
    },
  },
} as const;
