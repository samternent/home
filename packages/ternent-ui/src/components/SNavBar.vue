<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <div class="w-full bg-base-200 border-primary border-b-2">
    <div class="navbar max-w-7xl mx-auto w-full flex">
      <div class="flex-1">
        <RouterLink
          to="/"
          class="btn btn-ghost text-xl normal-case font-extrabold"
          >{{ title }}<span class="text-accent -mx-2">.</span></RouterLink
        >
      </div>
      <div class="flex-none">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>
