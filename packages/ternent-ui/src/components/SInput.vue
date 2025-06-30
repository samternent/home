<script setup>
import { computed, useAttrs, useSlots } from "vue";

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
    default: "micro",
    validator: (value) => ["nano", "micro", "small", "medium"].includes(value),
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "filled", "borderless"].includes(value),
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
});

const emit = defineEmits(["update:modelValue", "focus", "blur", "input"]);

const attrs = useAttrs();
const slots = useSlots();

const baseClasses = "input-micro";

const variantClasses = computed(() => ({
  default: "",
  filled: "input-filled",
  borderless: "input-borderless",
}));

const sizeClasses = computed(() => ({
  nano: "input-nano",
  micro: "input-micro-size",
  small: "input-small",
  medium: "input-medium",
}));

const inputClasses = computed(() => [
  baseClasses,
  variantClasses.value[props.variant],
  sizeClasses.value[props.size],
  {
    "input-error": props.error,
    "input-disabled": props.disabled,
    "pl-8": slots.left,
    "pr-8": slots.right,
  },
]);

const handleInput = (event) => {
  emit("update:modelValue", event.target.value);
  emit("input", event);
};
</script>

<template>
  <div class="input-wrapper">
    <!-- Label -->
    <label v-if="label" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>

    <!-- Input wrapper -->
    <div class="input-container">
      <!-- Left slot -->
      <div v-if="slots.left" class="input-icon-left">
        <slot name="left" />
      </div>

      <!-- Input -->
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        v-bind="attrs"
        @input="handleInput"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />

      <!-- Right slot -->
      <div v-if="slots.right" class="input-icon-right">
        <slot name="right" />
      </div>
    </div>

    <!-- Error message -->
    <p v-if="error" class="input-error-text">
      {{ error }}
    </p>

    <!-- Hint -->
    <p v-else-if="hint" class="input-hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.input-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
}

.input-required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.input-container {
  position: relative;
}

.input-micro {
  width: 100%;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-micro);
  transition: all 0.12s ease;
  color: var(--text-primary);
  outline: none;
}

.input-micro:focus {
  border-color: #3b82f6;
  box-shadow: var(--shadow-soft), 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-micro::placeholder {
  color: var(--text-tertiary);
}

/* Variants */
.input-filled {
  background: var(--bg-secondary);
  border: 1px solid transparent;
}

.input-filled:focus {
  background: var(--bg-primary);
  border-color: #3b82f6;
}

.input-borderless {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  border-radius: 0;
  box-shadow: none;
}

.input-borderless:focus {
  border-bottom-color: #3b82f6;
  box-shadow: 0 1px 0 0 #3b82f6;
}

/* Sizes */
.input-nano {
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
}

.input-micro-size {
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
}

.input-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
}

.input-medium {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
}

/* States */
.input-error {
  border-color: #ef4444;
}

.input-error:focus {
  border-color: #ef4444;
  box-shadow: var(--shadow-soft), 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Icons */
.input-icon-left {
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.input-icon-right {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.pl-8 {
  padding-left: 2rem;
}

.pr-8 {
  padding-right: 2rem;
}

/* Messages */
.input-error-text {
  font-size: 0.6875rem;
  color: #ef4444;
  margin: 0;
  line-height: 1.3;
}

.input-hint {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.3;
}
</style>
