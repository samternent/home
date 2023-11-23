<script setup>
defineProps({
  links: {
    type: Array,
    default: null,
  },
});
</script>
<template>
  <footer class="footer footer-center p-6 bg-base-200 text-base-content">
    <nav class="grid grid-flow-col gap-4">
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
    <nav>
      <slot name="middle" />
    </nav>
    <aside>
      <slot name="bottom" />
    </aside>
  </footer>
</template>
