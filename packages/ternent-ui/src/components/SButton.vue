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
    "font-medium tracking-tight ui-action leading-none",
    "transition-colors duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none",
    "border border-transparent rounded-xl",
  ];

  const size = {
    micro: "h-7 px-2.5 text-xs rounded-lg",
    xs: "h-8 px-3 text-xs rounded-lg",
    sm: "h-9 px-3.5 text-sm rounded-lg",
    md: "h-10 px-4 text-sm rounded-xl",
    lg: "h-11 px-5 text-base rounded-xl",
    xl: "h-12 px-6 text-base rounded-2xl",
  };

  const variants = {
    primary:
      "text-primary-content bg-primary shadow-sm hover:shadow-md hover:bg-primary/90 active:bg-primary/85",
    secondary:
      "text-base-content bg-base-200 border border-base-300 shadow-sm hover:bg-base-300 hover:border-base-400",
    accent:
      "text-primary bg-base-100 border border-primary/25 shadow-sm hover:border-primary/40 hover:bg-primary/5",
    outline:
      "text-primary border border-primary/50 bg-transparent shadow-none hover:bg-primary/10",
    ghost:
      "text-base-content/80 bg-transparent shadow-none hover:bg-base-200 hover:text-base-content",
    "ghost-icon":
      "text-base-content/80 bg-transparent shadow-none hover:bg-base-200 hover:text-base-content aspect-square p-0",
    link:
      "bg-transparent px-1 py-1 h-auto min-h-0 text-primary font-semibold underline-offset-4 hover:underline",
    success:
      "text-success-content bg-success/90 shadow-sm hover:bg-success",
    warning:
      "text-warning-content bg-warning/90 shadow-sm hover:bg-warning",
    error:
      "text-error-content bg-error/90 shadow-sm hover:bg-error",
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
