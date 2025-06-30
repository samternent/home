<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue"]);

function updateTheme(e) {
  emit("update:modelValue", e.target.checked ? "dark" : "light");
}

const checked = computed(() => props.modelValue === "dark");

const sizeClasses = computed(() => ({
  sm: { icon: "w-4 h-4", toggle: "toggle-sm" },
  md: { icon: "w-5 h-5", toggle: "" },
  lg: { icon: "w-6 h-6", toggle: "toggle-lg" },
}));
</script>
<template>
  <label class="flex cursor-pointer gap-3 items-center" aria-label="Toggle dark mode">
    <!-- Sun icon -->
    <svg
      v-if="size !== 'sm'"
      xmlns="http://www.w3.org/2000/svg"
      :class="[
        sizeClasses[size].icon,
        checked ? 'text-slate-400' : 'text-yellow-500'
      ]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <path
        d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
      />
    </svg>
    
    <!-- Toggle switch -->
    <div class="relative">
      <input
        type="checkbox"
        @click="updateTheme"
        :checked="checked"
        aria-label="Toggle dark mode"
        :class="[
          'sr-only'
        ]"
      />
      <div
        :class="[
          'w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out',
          checked 
            ? 'bg-indigo-600' 
            : 'bg-slate-200 dark:bg-slate-700'
        ]"
        @click="updateTheme"
      >
        <div
          :class="[
            'w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          ]"
        />
      </div>
    </div>
    
    <!-- Moon icon -->
    <svg
      v-if="size !== 'sm'"
      xmlns="http://www.w3.org/2000/svg"
      :class="[
        sizeClasses[size].icon,
        checked ? 'text-indigo-400' : 'text-slate-400'
      ]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  </label>
</template>
