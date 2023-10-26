<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
});

function isActiveLink(t) {
  return new RegExp(`${t.path}*`, "g").test(props.path);
}
</script>
<template>
  <ul
    class="flex max-w-[100vw] overflow-x-auto h-auto pb-3 overflow-y-hidden border-b border-default"
  >
    <li v-for="t in items" :key="`${t.path}`">
      <RouterLink
        :to="t.path"
        class="px-2 mx-1 py-3 hover:border-primary-light border-b-4 border-transparent"
        :class="{
          '!border-primary': isActiveLink(t),
        }"
      >
        {{ t.title }}
      </RouterLink>
    </li>
  </ul>
</template>
