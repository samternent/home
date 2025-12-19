<script setup>
import { computed, ref, nextTick } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["xs", "sm", "md", "lg", "xl", "base"].includes(value),
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "filled", "borderless", "ghost"].includes(value),
  },
  label: {
    type: String,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: undefined,
  },
  error: {
    type: String,
    default: undefined,
  },
  hint: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: undefined,
  },
  iconPosition: {
    type: String,
    default: "left",
    validator: (value) => ["left", "right"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "focus", "blur", "input", "enter"]);

const inputRef = ref(null);
const isFocused = ref(false);
const normalizedSize = computed(() => (props.size === "base" ? "md" : props.size));

// Focus management
const focus = async () => {
  await nextTick();
  inputRef.value?.focus();
};

const blur = () => {
  inputRef.value?.blur();
};

defineExpose({ focus, blur });

// Computed classes for the input wrapper
const wrapperClasses = computed(() => {
  const baseClasses = [
    'relative group transition-all duration-200 ease-out',
  ];

  if (props.disabled) {
    baseClasses.push('pointer-events-none opacity-50');
  }

  return baseClasses.join(' ');
});

// Computed classes for the input field
const inputClasses = computed(() => {
  const baseClasses = [
    'w-full border transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'placeholder-neutral-400 dark:placeholder-neutral-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs rounded-lg',
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl',
    lg: 'px-5 py-4 text-lg rounded-xl',
    xl: 'px-6 py-4 text-lg rounded-2xl',
  };

  // Variant classes
  const variantClasses = {
    default: [
      'bg-base-100',
      'border-base-300',
      'hover:border-base-content/30',
      'focus:border-primary-500 focus:ring-primary-500/20',
    ],
    filled: [
      'bg-base-200',
      'border-transparent',
      'hover:bg-base-300',
      'focus:bg-base-100',
      'focus:border-primary-500 focus:ring-primary-500/20',
    ],
    borderless: [
      'bg-transparent',
      'border-transparent',
      'hover:bg-base-200',
      'focus:bg-base-100',
      'focus:border-base-300',
      'focus:ring-base-content/10',
    ],
    ghost: [
      'bg-transparent',
      'border-neutral-200 dark:border-neutral-700',
      'hover:border-neutral-300 dark:hover:border-neutral-600',
      'focus:border-primary-500 focus:ring-primary-500/20',
    ],
  };

  const classes = [
    ...baseClasses,
    sizeClasses[normalizedSize.value] || sizeClasses.md,
    ...(variantClasses[props.variant] || variantClasses.default),
  ];

  // Error state
  if (props.error) {
    classes.push(
      '!border-red-500 !ring-red-500/20',
      'focus:!border-red-500 focus:!ring-red-500/20'
    );
  }

  // Icon padding adjustments
  if (props.icon && props.iconPosition === 'left') {
    const iconPadding = {
      xs: 'pl-8',
      sm: 'pl-9',
      md: 'pl-11',
      lg: 'pl-12',
      xl: 'pl-14',
    };
    classes.push(iconPadding[normalizedSize.value] || iconPadding.md);
  }

  if (props.icon && props.iconPosition === 'right') {
    const iconPadding = {
      xs: 'pr-8',
      sm: 'pr-9',
      md: 'pr-11',
      lg: 'pr-12',
      xl: 'pr-14',
    };
    classes.push(iconPadding[normalizedSize.value] || iconPadding.md);
  }

  return classes.join(' ');
});

// Label classes
const labelClasses = computed(() => [
  'block text-sm font-medium mb-2',
  'text-base-content',
  props.error ? 'text-red-600 dark:text-red-400' : '',
].filter(Boolean).join(' '));

// Icon classes
const iconClasses = computed(() => {
  const baseClasses = [
    'absolute top-1/2 -translate-y-1/2 pointer-events-none',
    'text-base-content/50',
  ];

  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const positionClasses = {
    left: {
      xs: 'left-2.5',
      sm: 'left-3',
      md: 'left-3',
      lg: 'left-4',
      xl: 'left-4',
    },
    right: {
      xs: 'right-2.5',
      sm: 'right-3',
      md: 'right-3',
      lg: 'right-4',
      xl: 'right-4',
    },
  };

  return [
    ...baseClasses,
    sizeClasses[normalizedSize.value] || sizeClasses.md,
    positionClasses[props.iconPosition][normalizedSize.value] || positionClasses[props.iconPosition].md,
  ].join(' ');
});

// Event handlers
const handleInput = (event) => {
  emit("update:modelValue", event.target.value);
  emit("input", event);
};

const handleFocus = (event) => {
  isFocused.value = true;
  emit("focus", event);
};

const handleBlur = (event) => {
  isFocused.value = false;
  emit("blur", event);
};

const handleKeydown = (event) => {
  if (event.key === 'Enter') {
    emit("enter", event);
  }
};
</script>

<template>
  <div :class="wrapperClasses">
    <!-- Label -->
    <label v-if="label" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Left icon -->
      <div v-if="icon && iconPosition === 'left'" :class="iconClasses">
        <slot name="icon">
          <svg v-if="icon === 'search'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <svg v-else-if="icon === 'mail'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <svg v-else-if="icon === 'user'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <svg v-else-if="icon === 'lock'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </slot>
      </div>

      <!-- Input field -->
      <input
        ref="inputRef"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        :class="inputClasses"
        :data-size="normalizedSize"
        :data-variant="variant"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <!-- Right icon or loading -->
      <div v-if="(icon && iconPosition === 'right') || loading" :class="iconClasses">
        <div v-if="loading" class="animate-spin">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <slot v-else name="icon">
          <svg v-if="icon === 'search'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </slot>
      </div>
    </div>

    <!-- Error message -->
    <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>

    <!-- Hint message -->
    <p v-if="hint && !error" class="mt-2 text-sm text-base-content/60">
      {{ hint }}
    </p>
  </div>
</template>
