<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <div role="alert" class="alert my-6 font-light tracking-tight text-2xl">
    <div>
      <slot name="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="stroke-info shrink-0 w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg> </slot
      ><span class="ml-4">{{ message }}</span>
    </div>
  </div>
</template>
