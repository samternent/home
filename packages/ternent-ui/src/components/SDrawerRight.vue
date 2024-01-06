<script setup>
import SButton from "./SButton.vue";

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});
defineEmits(["update:modelValue"]);
</script>
<template>
  <div class="drawer drawer-end">
    <input
      id="my-drawer-4"
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', !modelValue)"
      class="drawer-toggle"
    />
    <div class="drawer-content">
      <RouterView />
    </div>
    <div class="drawer-side z-20">
      <label
        for="my-drawer-4"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <div
        class="p-4 w-full max-w-4xl min-h-full bg-base-200 text-base-content"
      >
        <SButton
          @click="$emit('update:modelValue', false)"
          class="absolute right-2 top-2 btn-sm"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            data-slot="icon"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </SButton>
        <slot />
      </div>
    </div>
  </div>
</template>
