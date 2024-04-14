<script setup>
defineProps({
  links: {
    type: Array,
    default: null,
  },
});
</script>
<template>
  <footer
    class="text-sm font-light tracking-tight p-3 flex flex-col justify-center items-center md:items-left lg:items-center w-full"
  >
    <aside
      class="my-2 flex justify-center flex-col items-center md:items-left lg:items-center"
    >
      <slot name="top" />
    </aside>
    <nav class="flex gap-2 my-2 xs:flex-row lg:flex-row">
      <template v-for="link in links" :key="link.to">
        <a
          v-if="link.external"
          :href="link.to"
          target="_blank"
          class="link link-hover"
          >{{ link.title }}</a
        >
        <RouterLink v-else :to="link.to" class="link link-hover">{{
          link.title
        }}</RouterLink>
      </template>
    </nav>
    <aside
      class="my-2 flex justify-center flex-col items-center md:items-left lg:items-center"
    >
      <slot name="bottom" />
    </aside>
  </footer>
</template>
