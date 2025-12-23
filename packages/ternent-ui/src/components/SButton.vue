<script setup>
import { computed } from "vue";

// === PUBLIC API (unchanged) ===
const props = defineProps({
  // Navigation
  to: String,
  href: String,
  external: Boolean,

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
        "link",
        "success",
        "warning",
        "error",
      ].includes(v),
  },
  size: {
    type: String,
    default: "md",
    validator: (v) => ["micro", "xs", "sm", "md", "lg", "xl"].includes(v),
  },

  // States
  loading: Boolean,
  disabled: Boolean,

  // Layout
  fullWidth: Boolean,
  icon: Boolean,

  // Accessibility
  ariaLabel: String,
  ariaDescribedBy: String,
});

const emit = defineEmits(["click"]);

// === INTERNALS (from-scratch build) ===
// Goals:
//  - Never stretch to parent height (works in flex/grid): use self-center + h-auto
//  - Sizing by padding/typography (not fixed h-*) for regular buttons
//  - True square for icon-only
//  - Colors sourced 100% from your DaisyUI tokens: --p/--pc, --s/--sc, --a/--ac,
//    --su/--suc, --wa/--wac, --er/--erc, and radius from --rounded-btn

const sizeClasses = computed(() => {
  const regular = {
    micro: "text-[11px] px-2 py-1",
    xs: "text-xs px-2.5 py-1.5",
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
    xl: "text-lg px-6 py-3",
  };
  const iconOnly = {
    micro: "w-6 h-6 text-[11px] p-0",
    xs: "w-7 h-7 text-xs p-0",
    sm: "w-8 h-8 text-sm p-0",
    md: "w-10 h-10 text-sm p-0",
    lg: "w-11 h-11 text-base p-0",
    xl: "w-12 h-12 text-lg p-0",
  };
  return props.icon ? iconOnly[props.size] : regular[props.size];
});

const baseClasses = computed(() =>
  [
    // layout & a11y
    "btn-base inline-flex items-center justify-center gap-2 font-medium select-none",
    "whitespace-nowrap align-middle self-center h-auto",
    "transition-colors duration-200 focus-visible:outline-none",
    "disabled:opacity-60 disabled:cursor-not-allowed",
  ].join(" ")
);

const buttonClasses = computed(() => {
  const cls = [baseClasses.value, sizeClasses.value];
  if (props.fullWidth && !props.icon) cls.push("w-full");
  if (props.icon) cls.push("aspect-square !px-0 !py-0");
  if (props.loading) cls.push("relative");
  return cls.join(" ");
});

const tag = computed(() =>
  props.to ? "RouterLink" : props.href ? "a" : "button"
);

const componentProps = computed(() => {
  const base = {
    class: buttonClasses.value,
    disabled: props.disabled || props.loading,
    "aria-busy": props.loading || undefined,
    "aria-disabled": props.disabled || props.loading || undefined,
    "aria-label": props.ariaLabel,
    "aria-describedby": props.ariaDescribedBy,
    "data-variant": props.variant,
    "data-size": props.size,
  };
  if (props.to) return { ...base, to: props.to };
  if (props.href)
    return {
      ...base,
      href: props.href,
      target: props.external ? "_blank" : undefined,
      rel: props.external ? "noopener noreferrer" : undefined,
      role: "button",
    };
  return { ...base, type: "button" };
});

const onClick = (e) => {
  if (props.disabled || props.loading) {
    e.preventDefault();
    return;
  }
  emit("click", e);
};
</script>

<template>
  <component :is="tag" v-bind="componentProps" @click="onClick">
    <!-- loading overlay -->
    <span v-if="loading" class="absolute inset-0 grid place-items-center">
      <svg
        class="animate-spin h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span class="sr-only">Loading</span>
    </span>
    <span :class="loading ? 'opacity-0' : ''"><slot /></span>
  </component>
</template>

<style scoped>
/*
  COLOR/THEME LAYER (pure CSS, no Tailwind arbitrary var() needed)
  Uses your tokens from the provided theme snippet.
*/

.btn-base {
  border: 1px solid transparent;
  border-radius: var(--rounded-btn);
  --ring: var(--p);
}
.btn-base:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Primary */
[data-variant="primary"] {
  --ring: var(--p);
  background: var(--p);
  color: var(--pc);
}
[data-variant="primary"]:hover {
  background: color-mix(in oklch, var(--p) 88%, black 12%);
}

/* Secondary */
[data-variant="secondary"] {
  --ring: var(--s);
  background: var(--s);
  color: var(--sc);
}
[data-variant="secondary"]:hover {
  background: color-mix(in oklch, var(--s) 88%, black 12%);
}

/* Accent */
[data-variant="accent"] {
  --ring: var(--a);
  background: var(--a);
  color: var(--ac);
}
[data-variant="accent"]:hover {
  background: color-mix(in oklch, var(--a) 88%, black 12%);
}

/* Success */
[data-variant="success"] {
  --ring: var(--su);
  background: var(--su);
  color: var(--suc);
}
[data-variant="success"]:hover {
  background: color-mix(in oklch, var(--su) 88%, black 12%);
}

/* Warning */
[data-variant="warning"] {
  --ring: var(--wa);
  background: var(--wa);
  color: var(--wac);
}
[data-variant="warning"]:hover {
  background: color-mix(in oklch, var(--wa) 88%, black 12%);
}

/* Error */
[data-variant="error"] {
  --ring: var(--er);
  background: var(--er);
  color: var(--erc);
}
[data-variant="error"]:hover {
  background: color-mix(in oklch, var(--er) 88%, black 12%);
}

/* Outline (primary tone by default) */
[data-variant="outline"] {
  --ring: var(--p);
  background: transparent;
  color: var(--p);
  border-color: var(--p);
}
[data-variant="outline"]:hover {
  background: color-mix(in oklch, var(--p) 10%, transparent 90%);
  color: var(--pc);
}

/* Ghost */
[data-variant="ghost"] {
  --ring: var(--bc);
  background: transparent;
  color: color-mix(in oklch, var(--bc) 70%, transparent 30%);
}
[data-variant="ghost"]:hover {
  background: var(--b2);
  color: var(--bc);
}

/* Link */
[data-variant="link"] {
  --ring: var(--p);
  background: transparent;
  color: var(--p);
  text-decoration: underline;
  text-underline-offset: 4px;
  border-color: transparent;
  padding-left: 0;
  padding-right: 0;
}
[data-variant="link"]:hover {
  color: color-mix(in oklch, var(--p) 88%, black 12%);
}
</style>
