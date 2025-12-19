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

/** Modern, Stripe/Slack-inspired buttons with theme awareness */
const buttonClasses = computed(() => {
  const base = [
    "inline-flex items-center justify-center select-none gap-2",
    "font-medium tracking-tight ui-action",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    "active:scale-[0.98]",
    "border border-transparent rounded-2xl",
  ];

  const size = {
    micro: "min-h-6 h-6 px-2 text-xs rounded-lg",
    xs: "min-h-7 h-7 px-2.5 text-xs rounded-lg",
    sm: "min-h-8 h-8 px-3.5 text-sm rounded-xl",
    md: "min-h-10 h-10 px-5 text-sm rounded-2xl",
    lg: "min-h-12 h-12 px-6 text-base rounded-2xl",
    xl: "min-h-14 h-14 px-7 text-lg rounded-3xl",
  };

  const variants = {
    primary:
      "text-white bg-gradient-to-r from-primary via-primary/90 to-primary shadow-lg hover:shadow-xl",
    secondary:
      "text-base-content bg-base-100 border border-base-300/70 shadow-sm hover:-translate-y-px hover:shadow-lg",
    accent:
      "text-base-content bg-base-200/80 border border-base-300/70 hover:border-primary/50 hover:text-base-content/90",
    outline:
      "text-base-content border border-base-300/80 bg-transparent hover:border-primary/70 hover:text-primary",
    ghost:
      "text-base-content/80 bg-transparent hover:bg-base-200/70 hover:text-base-content",
    "ghost-icon":
      "text-base-content/80 bg-transparent hover:bg-base-200/70 hover:text-base-content aspect-square p-0",
    link: "bg-transparent px-1 py-1 h-auto min-h-0 text-primary font-semibold underline-offset-4 hover:underline",
    success:
      "text-success-content bg-success/90 hover:bg-success shadow-lg",
    warning:
      "text-warning-content bg-warning/90 hover:bg-warning shadow-lg",
    error:
      "text-error-content bg-error/90 hover:bg-error shadow-lg",
  };

  const cls = [
    ...base,
    size[normalizedSize.value] || size.md,
    variants[props.variant] || variants.primary,
  ];

  if (props.fullWidth) cls.push("w-full");
  if (props.icon) cls.push("aspect-square !px-0 text-lg");
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
