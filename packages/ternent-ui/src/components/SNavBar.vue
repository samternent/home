<script setup>
defineProps({
  title: {
    type: String,
    default: null,
  },
});
</script>
<template>
  <div class="w-full bg-base-100 border-primary border-b-2 sticky top-0 z-10">
    <div class="navbar flex min-h-0 items-center px-4">
      <div class="flex-1 flex items-center">
        <slot name="start">
          <RouterLink
            to="/"
            class="btn btn-ghost btn-sm text-base normal-case font-extrabold mr-4"
            >{{ title }}<span class="text-accent -mx-2">.</span></RouterLink
          >
        </slot>
      </div>
      <div class="flex-none">
        <slot name="end" />
      </div>
    </div>
  </div>
</template>
