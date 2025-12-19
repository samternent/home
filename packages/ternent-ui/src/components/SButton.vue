<script setup>
import { computed } from "vue";

const props = defineProps({
  // Navigation
  to: { type: String, default: undefined },
  href: { type: String, default: undefined },
  external: { type: Boolean, default: false },

  // Appearance
  variant: {
    type: String,
    default: "primary",
    validator: (v) =>
      [
        "primary",
        "secondary",
        "accent",
        "outline",
        "ghost",
        "ghost-icon",
        "link",
        "success",
        "warning",
        "error",
      ].includes(v),
  },
  size: {
    type: String,
    default: "md",
    validator: (v) => ["micro", "xs", "sm", "md", "lg", "xl", "base"].includes(v),
  },

  // States
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },

  // Layout
  fullWidth: { type: Boolean, default: false },
  icon: { type: Boolean, default: false },

  // Accessibility
  ariaLabel: { type: String, default: undefined },
  ariaDescribedBy: { type: String, default: undefined },
});

const emit = defineEmits(["click"]);

const normalizedSize = computed(() => (props.size === "base" ? "md" : props.size));

/** Premium DaisyUI button classes (calm, modern, accessible) */
const buttonClasses = computed(() => {
  const base = [
    "btn",
    "inline-flex items-center justify-center select-none",
    "transition-colors duration-150 ease-out",
    // Focus style that works on light/dark and respects your DS background
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
    // Softer elevation
    "shadow-sm hover:shadow",
    // Disable affordances
    "disabled:opacity-60 disabled:cursor-not-allowed",
    // Smooth press without layout jank
    "active:scale-95",
    // Remove default border noise unless variant needs it
    "border-0",
  ];

  const size = {
    micro: "btn-xs min-h-6 h-6 px-2 text-xs rounded-md",
    xs: "btn-xs min-h-7 h-7 px-2.5 text-xs rounded-lg",
    sm: "btn-sm min-h-8 h-8 px-3.5 text-sm rounded-lg",
    md: "btn-md min-h-10 h-10 px-5 text-sm rounded-xl",
    lg: "btn-lg min-h-12 h-12 px-6 text-base rounded-xl",
    xl: "min-h-14 h-14 px-7 text-lg rounded-2xl",
  };

  const variants = {
    primary:
      "btn-primary text-white bg-primary hover:bg-primary/90 active:bg-primary/80",
    secondary:
      "btn-secondary text-base-content bg-base-200 hover:bg-base-300 active:bg-base-300/80 border border-base-300",
    accent:
      "btn-accent text-white bg-accent hover:bg-accent/90 active:bg-accent/80",
    outline:
      "btn-outline text-base-content border border-base-300 hover:bg-base-200/60",
    ghost:
      "btn-ghost text-base-content/90 hover:bg-base-200/60 hover:text-base-content",
    "ghost-icon":
      "btn-ghost text-base-content/90 hover:bg-base-200/60 hover:text-base-content aspect-square p-0",
    link: "btn-link bg-transparent px-1 py-1 h-auto min-h-0 text-primary underline-offset-4 hover:underline",
    success:
      "btn-success text-white bg-success hover:bg-success/90 active:bg-success/80",
    warning:
      "btn-warning text-white bg-warning hover:bg-warning/90 active:bg-warning/80",
    error: "btn-error text-white bg-error hover:bg-error/90 active:bg-error/80",
  };

  const cls = [
    ...base,
    size[normalizedSize.value] || size.md,
    variants[props.variant] || variants.primary,
  ];

  // Full width
  if (props.fullWidth) cls.push("w-full", "btn-block");

  // Icon-only mode (keeps API but improves appearance)
  if (props.icon) cls.push("aspect-square !px-0 text-lg");

  // DaisyUI built-in spinner (works with .btn.loading)
  if (props.loading) cls.push("loading");

  return cls.join(" ");
});

const component = computed(() => {
  if (props.to) return "RouterLink";
  if (props.href) return "a";
  return "button";
});

const componentProps = computed(() => {
  const base = {
    class: buttonClasses.value,
    disabled: props.disabled || props.loading,
    "aria-busy": props.loading ? "true" : undefined,
    "aria-disabled": props.disabled || props.loading ? "true" : undefined,
    "aria-label": props.ariaLabel,
    "aria-describedby": props.ariaDescribedBy,
    "data-variant": props.variant,
    "data-size": normalizedSize.value,
  };

  if (props.to) return { ...base, to: props.to };
  if (props.href) {
    return {
      ...base,
      href: props.href,
      target: props.external ? "_blank" : undefined,
      rel: props.external ? "noopener noreferrer" : undefined,
      role: "button",
    };
  }
  return { ...base, type: "button" };
});

const handleClick = (e) => {
  if (props.disabled || props.loading) {
    e.preventDefault();
    return;
  }
  emit("click", e);
};
</script>

<template>
  <component :is="component" v-bind="componentProps" @click="handleClick">
    <slot />
  </component>
</template>
